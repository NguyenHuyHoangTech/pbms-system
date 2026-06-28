const fs = require('fs');
const path = require('path');
const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('target') && !file.includes('dist') && !file.includes('build')) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.java') || file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.sql')) {
                const content = fs.readFileSync(file, 'utf8');
                if (vietnameseRegex.test(content)) {
                    results.push(file);
                }
            }
        }
    });
    return results;
}

console.log(walk('.').join('\n'));
