const fs = require('fs');
const path = 'D:/0_Semester_5/pbms-system/pbms-fe/src/core/routes/AppRouter.tsx';
let content = fs.readFileSync(path, 'utf8');

// Revert the previous bad patch
content = content.replace(/export const AppRouter = \(\) => \{\n  import\('react'\)\.then\(\(\{\s*useEffect\s*\}\) => \{\s*useEffect\(\(\) => \{\s*\/\/\s*Fetch time offset on startup\s*import\('\.\.\/api\/axiosClient'\)\.then\(\(\{\s*axiosClient\s*\}\) => \{\s*axiosClient\.get\('\/system\/configs'\)\.then\(\(res: any\) => \{\s*const configs = res\.data\?\.data \|\| \[\];\s*const offsetConfig = configs\.find\(\(c: any\) => c\.configKey === 'TIME_SIMULATED_OFFSET_SECONDS'\);\s*if \(offsetConfig && offsetConfig\.configValue\) \{\s*import\('\.\.\/utils\/timeProvider'\)\.then\(\(\{\s*setSimulatedOffset\s*\}\) => \{\s*setSimulatedOffset\(parseInt\(offsetConfig\.configValue, 10\)\);\s*\}\);\s*\}\s*\}\)\.catch\(\(e: any\) => console\.error\('Failed to fetch time offset', e\)\);\s*\}\);\s*\}, \[\]\);\s*\}\);\n\n  return \(/, 'export const AppRouter = () => {\n  return (');

// Add proper imports
content = 'import { useEffect } from " react\;\nimport { axiosClient } from \../api/axiosClient\;\nimport { setSimulatedOffset } from \../utils/timeProvider\;\n' + content;

// Add useEffect properly
const properCode = 
export const AppRouter = () => {
 useEffect(() => {
 axiosClient.get('/system/configs').then((res: any) => {
 const configs = res.data?.data || [];
 const offsetConfig = configs.find((c: any) => c.configKey === 'TIME_SIMULATED_OFFSET_SECONDS');
 if (offsetConfig && offsetConfig.configValue) {
 setSimulatedOffset(parseInt(offsetConfig.configValue, 10));
 }
 }).catch((e: any) => console.error('Failed to fetch time offset', e));
 }, []);

 return (
;

content = content.replace(/export const AppRouter = \(\) => \{\n return \(/, properCode);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched AppRouter properly!');
