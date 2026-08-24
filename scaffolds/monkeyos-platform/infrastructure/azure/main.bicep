@description('Resource prefix')
param namePrefix string = 'monkeyos-prod'
param location string = resourceGroup().location
param vnetName string = '${namePrefix}-vnet'
param subnetName string = 'app'
param vnetCidr string = '10.50.0.0/16'
param subnetCidr string = '10.50.10.0/24'
@description('Trusted deployment runner or VPN CIDR')
param trustedSshCidr string
@description('Approved Cloudflare origin or controlled ingress CIDR')
param appIngressCidr string
@secure()
param deployerSshPublicKey string
param deployerUser string = 'deployer'
@minValue(1)
@maxValue(20)
param hostCount int = 2
@allowed(['arm64', 'amd64'])
@description('arm64 by default; amd64 supports AMD and Intel x86-64 hosts')
param runtimeArchitecture string = 'arm64'
@description('Optional architecture-compatible VM size override')
param vmSize string = ''
param imagePublisher string = 'Canonical'
param imageOffer string = 'ubuntu-24_04-lts'
@description('Optional architecture-compatible image SKU override')
param imageSku string = ''
param imageVersion string = 'latest'
@minValue(16)
param osDiskSizeGb int = 30
@allowed(['StandardSSD_LRS', 'Premium_LRS'])
param osDiskStorageType string = 'Premium_LRS'

var resolvedVmSize = !empty(vmSize) ? vmSize : (runtimeArchitecture == 'arm64' ? 'Standard_D2ps_v6' : 'Standard_D2s_v6')
var resolvedImageSku = !empty(imageSku) ? imageSku : (runtimeArchitecture == 'arm64' ? 'server-arm64' : 'server')

var cloudInit = '''#cloud-config
package_update: true
packages:
  - docker.io
users:
  - name: ${deployerUser}
    groups: [docker, sudo]
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    ssh_authorized_keys:
      - ${deployerSshPublicKey}
runcmd:
  - systemctl enable --now docker
'''

resource nsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: '${namePrefix}-runtime-nsg'
  location: location
  properties: {
    securityRules: [
      { name: 'allow-trusted-ssh', properties: { priority: 100, direction: 'Inbound', access: 'Allow', protocol: 'Tcp', sourcePortRange: '*', destinationPortRange: '22', sourceAddressPrefix: trustedSshCidr, destinationAddressPrefix: '*' } }
      { name: 'allow-cloudflare-http', properties: { priority: 110, direction: 'Inbound', access: 'Allow', protocol: 'Tcp', sourcePortRange: '*', destinationPortRanges: ['80', '443'], sourceAddressPrefix: appIngressCidr, destinationAddressPrefix: '*' } }
      { name: 'deny-other-inbound', properties: { priority: 4096, direction: 'Inbound', access: 'Deny', protocol: '*', sourcePortRange: '*', destinationPortRange: '*', sourceAddressPrefix: '*', destinationAddressPrefix: '*' } }
    ]
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: { addressPrefixes: [vnetCidr] }
  }
}

resource subnet 'Microsoft.Network/virtualNetworks/subnets@2024-05-01' = {
  parent: vnet
  name: subnetName
  properties: {
    addressPrefix: subnetCidr
    networkSecurityGroup: { id: nsg.id }
  }
}

resource publicIps 'Microsoft.Network/publicIPAddresses@2024-05-01' = [for index in range(0, hostCount): {
  name: '${namePrefix}-${padLeft(string(index + 1), 2, '0')}-pip'
  location: location
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}]

resource nics 'Microsoft.Network/networkInterfaces@2024-05-01' = [for index in range(0, hostCount): {
  name: '${namePrefix}-${padLeft(string(index + 1), 2, '0')}-nic'
  location: location
  properties: {
    ipConfigurations: [{
      name: 'primary'
      properties: { privateIPAllocationMethod: 'Dynamic', subnet: { id: subnet.id }, publicIPAddress: { id: publicIps[index].id } }
    }]
  }
}]

resource hosts 'Microsoft.Compute/virtualMachines@2024-07-01' = [for index in range(0, hostCount): {
  name: 'app-prod-${padLeft(string(index + 1), 2, '0')}'
  location: location
  properties: {
    hardwareProfile: { vmSize: resolvedVmSize }
    storageProfile: {
      imageReference: { publisher: imagePublisher, offer: imageOffer, sku: resolvedImageSku, version: imageVersion }
      osDisk: { createOption: 'FromImage', managedDisk: { storageAccountType: osDiskStorageType }, diskSizeGB: osDiskSizeGb }
    }
    osProfile: {
      computerName: 'app-prod-${padLeft(string(index + 1), 2, '0')}'
      adminUsername: deployerUser
      customData: base64(cloudInit)
      linuxConfiguration: { disablePasswordAuthentication: true, ssh: { publicKeys: [{ path: '/home/${deployerUser}/.ssh/authorized_keys', keyData: deployerSshPublicKey }] } }
    }
    networkProfile: { networkInterfaces: [{ id: nics[index].id, properties: { primary: true } }] }
    securityProfile: { encryptionAtHost: true }
  }
}]

output networkId string = vnet.id
output appSubnetId string = subnet.id
output runtimeHostPublicIps array = [for index in range(0, hostCount): publicIps[index].properties.ipAddress]
output configuredHostCount int = hostCount
output selectedRuntimeArchitecture string = runtimeArchitecture
output sshUser string = deployerUser
