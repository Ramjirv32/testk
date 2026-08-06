/**
 * JWT Token Debugging Utility
 * Use this to diagnose token issues
 */

export interface DecodedToken {
  header: any;
  payload: any;
  signature: string;
  isExpired: boolean;
  expiresIn: string;
  raw: string;
}

/**
 * Decode JWT token (for debugging only)
 * Does NOT verify the signature
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('Invalid token format. Expected 3 parts, got:', parts.length);
      return null;
    }

    const [headerEncoded, payloadEncoded, signature] = parts;

    // Decode header
    const header = JSON.parse(atob(headerEncoded));

    // Decode payload
    const payload = JSON.parse(atob(payloadEncoded));

    // Check expiration
    const now = Date.now() / 1000;
    const isExpired = payload.exp ? payload.exp < now : false;
    const expiresIn = payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration';

    return {
      header,
      payload,
      signature: signature.substring(0, 20) + '...',
      isExpired,
      expiresIn,
      raw: token,
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check token in localStorage and log details
 */
export function debugStoredToken(): void {
  if (typeof window === 'undefined') {
    console.log('Not in browser environment');
    return;
  }

  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  console.log('=== TOKEN DEBUG INFO ===');
  console.log('Token exists:', !!token);
  console.log('User exists:', !!user);

  if (!token) {
    console.warn('No token found in localStorage');
    return;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    console.error('Failed to decode token');
    return;
  }

  console.log('\n--- Token Header ---');
  console.log('Algorithm:', decoded.header.alg);
  console.log('Type:', decoded.header.typ);

  console.log('\n--- Token Payload ---');
  console.log('User ID (sub):', decoded.payload.sub);
  console.log('Email:', decoded.payload.email);
  console.log('Role:', decoded.payload.role);
  console.log('Name:', decoded.payload.name);
  console.log('Issued At:', decoded.payload.iat ? new Date(decoded.payload.iat * 1000).toISOString() : 'N/A');
  console.log('Expires At:', decoded.expiresIn);
  console.log('Is Expired:', decoded.isExpired ? '⚠️ YES' : '✅ NO');

  console.log('\n--- Token Signature (first 20 chars) ---');
  console.log(decoded.signature);

  if (user) {
    console.log('\n--- Stored User ---');
    console.log(JSON.parse(user));
  }

  console.log('\n=== END DEBUG INFO ===');
}

/**
 * Check if token would be sent correctly in API calls
 */
export function debugTokenTransmission(): void {
  if (typeof window === 'undefined') {
    console.log('Not in browser environment');
    return;
  }

  const token = localStorage.getItem('token');

  if (!token) {
    console.error('No token found');
    return;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    console.error('Invalid token format');
    return;
  }

  console.log('=== TOKEN TRANSMISSION DEBUG ===');
  console.log('Token length:', token.length, 'characters');
  console.log('Token starts with:', token.substring(0, 20) + '...');
  console.log('Authorization header would be:');
  console.log(`Bearer ${token}`);
  console.log('\nFull header: Authorization: Bearer ' + token);
  console.log('=== END TRANSMISSION DEBUG ===');
}

/**
 * Verify token structure and content
 */
export function verifyTokenStructure(token: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!token) {
    errors.push('Token is empty or null');
    return { valid: false, errors, warnings };
  }

  if (typeof token !== 'string') {
    errors.push(`Token is not a string, got: ${typeof token}`);
    return { valid: false, errors, warnings };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    errors.push(`Token has ${parts.length} parts, expected 3 (header.payload.signature)`);
    return { valid: false, errors, warnings };
  }

  // Check each part is valid base64
  try {
    atob(parts[0]);
  } catch {
    errors.push('Header is not valid base64');
  }

  try {
    atob(parts[1]);
  } catch {
    errors.push('Payload is not valid base64');
  }

  if (!parts[2]) {
    errors.push('Signature is missing');
  }

  // Try to decode
  try {
    const decoded = decodeToken(token);
    if (!decoded) {
      errors.push('Failed to decode token');
    } else {
      // Check required claims
      if (!decoded.payload.sub) {
        warnings.push('Missing "sub" (subject/user ID) claim');
      }
      if (!decoded.payload.exp) {
        warnings.push('Missing "exp" (expiration) claim - token will not expire');
      }
      if (decoded.isExpired) {
        errors.push('Token has expired');
      }
    }
  } catch (error: any) {
    errors.push(`Decode error: ${error.message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get diagnostic report
 */
export function getDiagnosticReport(): string {
  const lines: string[] = [];

  lines.push('=== JWT TOKEN DIAGNOSTIC REPORT ===');
  lines.push('');

  if (typeof window === 'undefined') {
    lines.push('⚠️  Not in browser environment - cannot check localStorage');
    return lines.join('\n');
  }

  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  lines.push('1. STORAGE CHECK');
  lines.push(`   Token stored: ${token ? '✅ YES' : '❌ NO'}`);
  lines.push(`   User stored: ${user ? '✅ YES' : '❌ NO'}`);
  lines.push('');

  if (!token) {
    lines.push('❌ ERROR: No token found. Please login first.');
    return lines.join('\n');
  }

  lines.push('2. TOKEN STRUCTURE');
  const structure = verifyTokenStructure(token);
  if (structure.valid) {
    lines.push('   ✅ Valid JWT format');
  } else {
    structure.errors.forEach(err => lines.push(`   ❌ ${err}`));
  }
  structure.warnings.forEach(warn => lines.push(`   ⚠️  ${warn}`));
  lines.push('');

  lines.push('3. TOKEN CONTENT');
  const decoded = decodeToken(token);
  if (decoded) {
    lines.push(`   Algorithm: ${decoded.header.alg}`);
    lines.push(`   User ID: ${decoded.payload.sub || 'N/A'}`);
    lines.push(`   Email: ${decoded.payload.email || 'N/A'}`);
    lines.push(`   Role: ${decoded.payload.role || 'N/A'}`);
    lines.push(`   Expires: ${decoded.expiresIn}`);
    lines.push(`   Status: ${decoded.isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
  }
  lines.push('');

  lines.push('4. TRANSMISSION READINESS');
  lines.push(`   Token length: ${token.length} chars`);
  lines.push(`   Can send as Bearer: ${token.startsWith('eyJ') ? '✅ YES' : '❌ NO'}`);
  lines.push('');

  lines.push('5. RECOMMENDATIONS');
  if (decoded?.isExpired) {
    lines.push('   • Token is expired - please login again');
  } else if (!decoded) {
    lines.push('   • Token format is invalid - clear storage and login again');
  } else {
    lines.push('   • Token appears valid, issue may be on backend');
    lines.push('   • Check Go backend JWT_SECRET configuration');
    lines.push('   • Verify backend is using same JWT algorithm');
  }

  lines.push('');
  lines.push('=== END REPORT ===');

  return lines.join('\n');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).tokenDebug = {
    decodeToken,
    debugStoredToken,
    debugTokenTransmission,
    verifyTokenStructure,
    getDiagnosticReport,
  };
  
  console.log('✅ Token debug tools available: window.tokenDebug.getDiagnosticReport()');
}
