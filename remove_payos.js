const fs = require('fs');
let content = fs.readFileSync('D:/0_Semester_5/pbms-system/pbms-fe/src/features/system/SystemConfigScreen.tsx', 'utf8');

// 1. Remove state
content = content.replace(/  \/\/ PayOS Configs\r?\n  const \[payosClientId, setPayosClientId\] = useState\(''\);\r?\n  const \[payosApiKey, setPayosApiKey\] = useState\(''\);\r?\n  const \[payosChecksumKey, setPayosChecksumKey\] = useState\(''\);\r?\n\r?\n/g, '');

// 2. Remove Status
content = content.replace(/  const \[testPayosStatus, setTestPayosStatus\] = useState<'idle' \| 'testing' \| 'success' \| 'error'>\('idle'\);\r?\n/g, '');

// 3. Remove getVal assignments
content = content.replace(/      setPayosClientId\(getVal\('PAYOS_CLIENT_ID'\)\);\r?\n      setPayosApiKey\(getVal\('PAYOS_API_KEY'\)\);\r?\n      setPayosChecksumKey\(getVal\('PAYOS_CHECKSUM_KEY'\)\);\r?\n/g, '');

// 4. Update mutationFn type
content = content.replace(/mutationFn: async \(type: 'EMAIL' \| 'PAYOS' \| 'PAYPAL'\) =>/g, "mutationFn: async (type: 'EMAIL' | 'PAYPAL') =>");

// 5. Remove onMutate, onSuccess, onError hooks for PAYOS
content = content.replace(/      if \(type === 'PAYOS'\) setTestPayosStatus\('testing'\);\r?\n/g, '');
content = content.replace(/      if \(type === 'PAYOS'\) setTestPayosStatus\('success'\);\r?\n/g, '');
content = content.replace(/      if \(type === 'PAYOS'\) setTestPayosStatus\('error'\);\r?\n/g, '');

// 6. Remove updateIfChanged calls
content = content.replace(/      updateIfChanged\('PAYOS_CLIENT_ID', payosClientId\);\r?\n      updateIfChanged\('PAYOS_API_KEY', payosApiKey\);\r?\n      updateIfChanged\('PAYOS_CHECKSUM_KEY', payosChecksumKey\);\r?\n/g, '');

// 7. Remove Card UI
// We can use a regex to match from {/* PAYOS CONFIG */} to the next {/* PAYPAL CONFIG */}
content = content.replace(/            \{\/\* PAYOS CONFIG \*\/\}.*?(?=            \{\/\* PAYPAL CONFIG \*\/})/s, '');

// 8. Update disabled logic
content = content.replace(/disabled=\{testEmailStatus !== 'success' \|\| testPayosStatus !== 'success' \|\| testPaypalStatus !== 'success'\}/g, "disabled={testEmailStatus !== 'success' || testPaypalStatus !== 'success'}");
content = content.replace(/testEmailStatus !== 'success' \|\| testPayosStatus !== 'success' \|\| testPaypalStatus !== 'success'/g, "testEmailStatus !== 'success' || testPaypalStatus !== 'success'");

fs.writeFileSync('D:/0_Semester_5/pbms-system/pbms-fe/src/features/system/SystemConfigScreen.tsx', content, 'utf8');
console.log('Done replacing!');
