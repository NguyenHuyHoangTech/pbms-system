const fs = require('fs');
const path = 'D:/0_Semester_5/pbms-system/pbms-be/src/main/java/com/pbms/modules/system/service/SystemConfigService.java';
let content = fs.readFileSync(path, 'utf8');

const insertCode = 
    @Transactional
    public SystemConfig saveOrUpdateConfigValue(String key, String value) {
        SystemConfig config = repository.findByConfigKey(key).orElse(null);
        if (config == null) {
            config = SystemConfig.builder()
                .configKey(key)
                .configValue(value)
                .description(" T? d?ng t?o\)
 .build();
 return repository.save(config);
 } else {
 config.setConfigValue(value);
 return repository.save(config);
 }
 }
;

content = content.replace(/public SystemConfig getConfigByKey\\(String key\\) \\{/, insertCode + '\n public SystemConfig getConfigByKey(String key) {');

fs.writeFileSync(path, content, 'utf8');
console.log('Patched SystemConfigService!');
