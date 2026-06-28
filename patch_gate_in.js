const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pbms-fe', 'src', 'features', 'staff', 'GateInConsoleScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// I will insert the missing code right before 'const handleCheckIn = async () => {'
const targetStr = '  const handleCheckIn = async () => {';

const missingCode = `
  useEffect(() => {
    // Only cleanup active slot logic if any
    return () => {
      if (tweenRef.current) clearInterval(tweenRef.current as any);
    }
  }, []);

  useEffect(() => {
    if (activeGate && stompClient && connected) {
      const destination = \`/topic/gates/\${activeGate.id}/scans\`;
      addLog(\`Subscribed to \${destination}\`);
      
      const subscription = stompClient.subscribe(destination, (msg) => {
        if (isProcessingRef.current) {
          addLog("Close stream band: Ignore new signal due to pending processing of current vehicle");
          return;
        }
        isProcessingRef.current = true;

        addLog(\`Received message. Length: \${msg.body.length} bytes\`);
        console.log("RECEIVED WEBSOCKET MESSAGE:", msg.body);
        const payload = JSON.parse(msg.body);
        if (payload.actionType === 'OUT') {
            isProcessingRef.current = false;
            return;
        }
        setLastRawPayload(payload);
        
        // IOT payload contains plateNumber, imageBase64, confidence
        // For UI purposes, we'll map it to our UI state shape
        setEditablePlate(payload.plateNumber || 'UNKNOWN');
        
        setScanData({
            plateNumber: payload.plateNumber,
            imageBase64: payload.imageBase64 || '',
            lprImageBase64: payload.lprImageBase64 || '',
            imageInBase64: payload.picInPanorama || '',
            imageOutBase64: payload.imageBase64 || '',
            lprImageInBase64: payload.picInFace || '',
            lprImageOutBase64: payload.lprImageBase64 || '',
            plateNumberIn: payload.plateNumberIn || payload.plateNumber || 'UNKNOWN',
            timeIn: payload.timeIn ? simulatedDayjs(payload.timeIn).format('DD/MM/YYYY HH:mm:ss') : '--:--',
            timeOut: simulatedDayjs().format('DD/MM/YYYY HH:mm:ss'),
            duration: payload.durationMinutes ? \`\${payload.durationMinutes} minutes\` : '--',
            feeBase: 0,
            feePenalty: 0,
            discount: 0,
            expectedFee: payload.expectedFee || 0,
            durationMinutes: payload.durationMinutes || 0,
            isBlacklisted: false,
            warnings: [],
            rfid: payload.rfid || '---',
            customerType: payload.customerType === 'PREBOOKED' ? 'BOOK' : (payload.customerType === 'MONTHLY' ? 'Monthly Pass' : (payload.customerType || 'Haunt')),
            vehicleType: payload.vehicleType || 'CAR',
            routing: payload.suggestedZoneName || ''
          });
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [activeGate, stompClient, connected]);

  const handleCancel = () => {
    isProcessingRef.current = false;
    setScanData(null);
    setEditablePlate('');
    message.warning('The current scanning session has been canceled e System has reopened e');
  };

`;

content = content.replace(targetStr, missingCode + targetStr);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed GateInConsoleScreen.tsx');
