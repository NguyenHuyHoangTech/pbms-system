const fs = require('fs');

function addEventListener(path, methodName) {
    let content = fs.readFileSync(path, 'utf8');
    if (!content.includes('import org.springframework.context.event.EventListener;')) {
        content = content.replace(/import org.springframework.stereotype.Service;/, import org.springframework.stereotype.Service;\nimport org.springframework.context.event.EventListener;\nimport com.pbms.common.event.TimeFastForwardedEvent;);
    }
    
    // Replace @Scheduled(...) with @Scheduled(...)\n    @EventListener(TimeFastForwardedEvent.class)
    const regex = new RegExp((@Scheduled\\([^)]+\\)\\s*\\n\\s*@Transactional\\s*\\n\\s*public void \\(\\)));
    if (content.match(regex)) {
        content = content.replace(regex, @Scheduled()\n    @EventListener(TimeFastForwardedEvent.class)\n    @Transactional\n    public void ());
        // wait the regex replacement is a bit complex, let's just use simple string replacement
    }
    fs.writeFileSync(path, content, 'utf8');
}
