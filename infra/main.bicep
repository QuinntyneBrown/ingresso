// ingresso on Azure at the lowest production-grade cost (ADR 0023):
// App Service Basic B1 (Linux) + Azure SQL Database Basic (5 DTU). About USD 18 a month.
targetScope = 'resourceGroup'

@description('Prefix for resource names; must be globally unique for the web app and SQL server.')
param name string = 'ingresso'
param location string = resourceGroup().location

@secure()
param sqlAdminPassword string
param sqlAdminLogin string = 'ingressoadmin'

@description('Path of the PKCS#12 certificate inside the deployed package.')
param certificatePath string = '/home/site/wwwroot/certs/ingresso.pfx'
@secure()
param certificatePassword string

@description('Domain the sign-in emails are sent from; its DNS must carry the verification, SPF and DKIM records Azure Communication Services asks for.')
param emailDomain string = 'ingresso.ca'
param emailSenderUsername string = 'noreply'
@description('Set once the email domain shows as Verified: links it to the Communication Services resource and switches the API to send real mail.')
param emailDomainLinked bool = false

var suffix = uniqueString(resourceGroup().id)
var siteName = '${name}-${suffix}'
var sqlName = '${name}-sql-${suffix}'
var dbName = 'Ingresso'
var emailServiceName = '${name}-email-${suffix}'
var communicationName = '${name}-comm-${suffix}'

resource sql 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
  }
}

resource db 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sql
  name: dbName
  location: location
  sku: { name: 'Basic', tier: 'Basic', capacity: 5 }
  properties: { maxSizeBytes: 2147483648 }
}

// 0.0.0.0 lets the web app reach the server; the deploy workflow opens and closes a rule for its own runner.
resource allowAzure 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sql
  name: 'AllowAzureServices'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${name}-plan'
  location: location
  kind: 'linux'
  sku: { name: 'B1', tier: 'Basic', capacity: 1 }
  properties: { reserved: true }
}

var connectionString = 'Server=tcp:${sql.properties.fullyQualifiedDomainName},1433;Database=${dbName};User ID=${sqlAdminLogin};Password=${sqlAdminPassword};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

// Outbound email: Azure Communication Services with a customer-managed sender domain (ADR 0023).
resource emailService 'Microsoft.Communication/emailServices@2023-04-01' = {
  name: emailServiceName
  location: 'global'
  properties: { dataLocation: 'Canada' }
}

resource emailSenderDomain 'Microsoft.Communication/emailServices/domains@2023-04-01' = {
  parent: emailService
  name: emailDomain
  location: 'global'
  properties: {
    domainManagement: 'CustomerManaged'
    userEngagementTracking: 'Disabled'
  }
}

resource emailSender 'Microsoft.Communication/emailServices/domains/senderUsernames@2023-04-01' = {
  parent: emailSenderDomain
  name: emailSenderUsername
  properties: {
    username: emailSenderUsername
    displayName: 'ingresso'
  }
}

resource communication 'Microsoft.Communication/communicationServices@2023-04-01' = {
  name: communicationName
  location: 'global'
  properties: {
    dataLocation: 'Canada'
    linkedDomains: emailDomainLinked ? [emailSenderDomain.id] : []
  }
}

resource site 'Microsoft.Web/sites@2023-12-01' = {
  name: siteName
  location: location
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/health/ready'
      appSettings: [
        { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
        { name: 'Database__Provider', value: 'SqlServer' }
        { name: 'Swagger__Enabled', value: 'false' }
        { name: 'IdentityProvider__SigningCertificate__Path', value: certificatePath }
        { name: 'IdentityProvider__SigningCertificate__Password', value: certificatePassword }
        { name: 'DataProtection__Certificate__Path', value: certificatePath }
        { name: 'DataProtection__Certificate__Password', value: certificatePassword }
        { name: 'Email__Provider', value: emailDomainLinked ? 'AzureCommunicationServices' : 'DevMailbox' }
        { name: 'Email__From', value: '${emailSenderUsername}@${emailDomain}' }
        { name: 'Email__AzureCommunicationServices__ConnectionString', value: communication.listKeys().primaryConnectionString }
      ]
      connectionStrings: [
        { name: 'Default', type: 'SQLAzure', connectionString: connectionString }
      ]
    }
  }
}

output siteName string = site.name
output siteUrl string = 'https://${site.properties.defaultHostName}'
output sqlServerName string = sql.name
output sqlServerFqdn string = sql.properties.fullyQualifiedDomainName
output databaseName string = dbName
output emailServiceName string = emailService.name
output emailDomainVerification object = emailSenderDomain.properties.verificationRecords

