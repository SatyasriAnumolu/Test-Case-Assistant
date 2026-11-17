# Azure DevOps Entra Conditional Access Policy (VS403463) - Administrator Guide

## Problem

Users receive error **VS403463** when trying to connect the Test Case Assistant to Azure DevOps:

```
Azure DevOps blocked project discovery because of a Microsoft Entra Conditional Access policy (VS403463).
```

This occurs because the application uses **PAT (Personal Access Token)** authentication, which is blocked by your organization's Microsoft Entra Conditional Access policies that require:
- Interactive Multi-Factor Authentication (MFA)
- Compliant device verification
- Specific sign-in flows (OAuth)

---

## Solutions

### Solution 1: Whitelist the Application/IP (Fastest)

If you have access to Entra Conditional Access policies:

1. **Sign in to Azure Portal** (portal.azure.com)
2. **Navigate to**: Azure Entra ID → Security → Conditional Access → Policies
3. **Find the policy** blocking Azure DevOps (likely policy name contains "Azure DevOps" or "VS403463")
4. **Edit the policy** and:
   - Add the **Test Case Assistant application IP/domain** to exclusions
   - Or add **specific user groups** that need access
   - Or add the **service principal** running the application
5. **Apply changes** and test the connection

---

### Solution 2: Configure OAuth Sign-In Flow (Recommended Long-Term)

For a more secure and compliant solution:

1. **Request OAuth Implementation**: Contact the Test Case Assistant development team to implement OAuth instead of PAT
   - OAuth supports interactive authentication
   - Complies with modern security policies
   - Better for enterprise environments

2. **Azure DevOps OAuth Setup**:
   - Register application in Azure Entra ID
   - Configure OAuth scopes for Azure DevOps APIs
   - Update Conditional Access policy to allow OAuth

3. **User Experience**: Users will see a "Sign In" button and complete interactive authentication

---

### Solution 3: Configure Compliant Device/MFA

If your policy requires compliant devices or MFA:

1. **Ensure devices are compliant** according to your Intune/device management policies
2. **Enable MFA** for all users requiring Azure DevOps access
3. **Update the policy** to allow PAT for compliant users after MFA

---

## Affected Users

Users will see this error when:
- Entering organization and PAT credentials on the ADO Connection page
- Project discovery fails with VS403463 error
- Any Azure DevOps API call (test plans, suites, test cases) is blocked

---

## Testing After Fix

1. **Have a test user** try the connection from:
   - Same network/IP as whitelisted range
   - Different device (if device compliance is involved)
   - After MFA reset (if MFA is required)

2. **Expected behavior after fix**:
   - Organization/Project fields populate successfully
   - "Test Connection" button returns success
   - Project selection becomes available

---

## Error Details for Support

**Error Code**: VS403463  
**Service**: Azure DevOps (dev.azure.com)  
**Auth Method**: Personal Access Token (PAT)  
**Issue**: Blocked by Conditional Access Policy  
**Policy Type**: Modern authentication, MFA, or device compliance requirement  

---

## Contact Information

For implementation help or questions:
- **Development Team**: AVEVA Test Case Assistant team
- **Azure Support**: Microsoft Support for Entra ID / Conditional Access
- **Local Admin**: Contact your Azure Entra ID / Azure DevOps administrator

---

## Related Documentation

- [Microsoft Entra Conditional Access Policies](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview)
- [Azure DevOps Personal Access Tokens](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)
- [OAuth 2.0 for Azure DevOps](https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/oauth)
