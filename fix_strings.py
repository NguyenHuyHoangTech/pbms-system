import os, json

with open('non_ascii_strings.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Hardcoded fixes mapping (corrupted string snippet -> correct english replacement snippet)
fixes = {
    # DashboardController
    "This is the price of the cheese— according to the market price.": "Data fetched successfully.",
    
    # PaymentController
    "Leave—I confirm payment:": "Payment confirmation error:",
    
    # RefundController
    "ÄÃ£ sole»‡activities": "Refund processed successfully",
    "ÄÃ£ dozen»« chá»‘i or ti»n": "Refund rejected successfully",
    "ÄÃ£ is the proof": "Proof uploaded successfully",
    
    # RefundService
    "ÄÆ¡completed": "Refund request ",
    "Ä‘Ã£ Ä‘Æ°á»£ac» is the thing that can be heard": " has been approved.",
    "ba»‹ ta»« chá»‘i:": " has been rejected. Reason: ",
    
    # RevenueService
    "\"COaLESCE(vtetype_name, 'Unclear') aS vehicleType,\" +": "\"    COALESCE(vt.type_name, 'Unclear') AS vehicleType, \" +",
    "\"WHEN psepenalty_fee o 0 THEN N'Phaº¡t'\" +": "\"    WHEN ps.penalty_fee > 0 THEN 'Penalty' \" +",
    "\"WHEN psereservation_id IS NOT NULL THEN N'Äáº·t chá»—'\" +": "\"    WHEN ps.reservation_id IS NOT NULL THEN 'Reservation' \" +",
    "\"WHEN mteid IS NOT NULL THEN N'VÃ© thÃ¡ng'\" +": "\"    WHEN mt.id IS NOT NULL THEN 'Monthly Ticket' \" +",
    "\"ELSE N'VÃ¢â‚¬â€œ\" +": "\"    ELSE 'Standard Ticket' \" +",
    "\"COaLESCE(vtetype_name, 'Not clear'),\" +": "\"    COALESCE(vt.type_name, 'Unclear'), \" +",
    "\"It's not clear that aS vehicleType,\" +": "\"    'Unclear' AS vehicleType, \" +",
    "\"N'Pháº¡t ha»§y chá»—' aS revenueSource,\" +": "\"    'Reservation Cancellation Penalty' AS revenueSource, \" +",
    
    # PayPalStrategy
    "PayPal only accepts invoices—nothing like that": "PayPal strategy not implemented",
    "Leaves—when do you want to pay PayPale?": "Error executing PayPal payment:",
    
    # AuthController
    "OTP CODE Ä‘Ã£ Ä‘Æ°á»£c girl Ä‘áº¿n email address": "OTP CODE has been sent to email address",
    "ÄÄºtap ºnge Ã´nge": "Login successful",
    "ÄÃ£ the coolest thing is pretty cool": "Verification successful",
    "ÄÃ£ link from Google": "Google Login successful",
    
    # WorkSessionController
    "La»—i ma»Ÿ ca:": "Error starting shift:",
    "ÄÃ£ Ä‘Ã³ng ca trai»±cÃ´ng": "Shift closed successfully",
    "La»—i Ä‘Ã³ng ca:": "Error closing shift:",
    "La»—i laº¥th tin ca:": "Error fetching current shift:",
    "La»—i laº¥y la»‹book» ca tra»±c:": "Error fetching shift history:",
    
    # RegisterRequest / SetPasswordRequest / ResetPasswordRequest
    "The dish is quite good, 8-20 pieces, 1 piece of flower, 1 piece of fruit, 1 piece and 1 piece of fruit. bi»‡t": "Password must be 8-20 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    
    # AuthService
    "I don't know what to do anymore viÃƒÂªne": "Role not found",
    
    # UserService
    "The role is not so bad‡:": "Invalid role requested:",
    
    # WorkSessionService
    "ÄÃ£ Ä‘á»“promoter»™ of fruit leaves, no fruit juice": "Shift already active",
    
    # IncidentTicketController
    "Leaf—i dozen incident:": "Error creating incident:",
    "La»—i forgive» is incident:": "Error closing incident:",
    "Leaf»—i hai»§y sa»± fish»‘:": "Error cancelling incident:",
    "ÄÃ£ how long and how long it has been—": "Incident cancelled successfully",
    "Leave»—I don't know:": "Error handling incident:",
    "Leave»—i forgive» is phase 1:": "Error handling incident phase 1:",
    "Tá»« chá»‘i sa»± ca»‘ thá also": "Incident rejected successfully",
    "Lá»—i ta»« chá»‘i:": "Error rejecting incident:",
    "Leaves—what's the price:": "Error fetching incident:",
    
    # IncidentService
    "New car performance— price 72! Bi»ƒn sa»‘:": "Overstay alert! Vehicle exceeded 72 hours! Plate: ",
    
    # PublicController
    "Download the list of languages ??that need to be changed": "Fetched vehicle types successfully",
    
    # MapConfigurationService
    "Uncertainty in the area. c\" + cz.getZoneName() + \"and the vehicle has a motorbike—e": "Invalid zone \" + cz.getZoneName() + \" for vehicle type",
    "Patch area»±c\" + zDTO.getName() + \"There are different types of vehicle types that are not quite suitable for fishing vehicles in Táº§nge.": "Zone \" + zDTO.getName() + \" vehicle type does not match the floor vehicle type.",
    "Not sure what the price is?\" + es.getSlotName() + \"and the vehicle has a motorbike—e": "Invalid slot \" + es.getSlotName() + \" for vehicle type",
    "Unable to report on the market—\" + es.getSlotName() + \"and the vehicle has a motorbike—e": "Unable to find slot \" + es.getSlotName() + \" for vehicle type",
    
    # RfidCardService
    "Náº±m tr»‘ng": "Available",
    "In the room": "In use",
    "Not sure": "Unknown",
    
    # RoutingRuleService
    "Other price brackets": "Default routing",
    "Price range»": "Route ",
    
    # IotIntegrationController
    "Leaves—i bet:": "IOT event error:",
    
    # MonthlyTicketController
    "ÄÄƒ kÃ½ and often": "Monthly ticket registered successfully",
    "La»—i Ä‘Äƒng kÃ½ and thÃ¡ng:": "Error registering monthly ticket:",
    "La»—i family and common:": "Error renewing monthly ticket:",
    
    # ParkingSessionController
    "Do not take advantage of this type of vehicle—chemical vehicle or other commercial vehicle.": "No active session found for this plate.",
    "There are no buses—": "Session fetched successfully",
    
    # ReservationController
    "La»—i ha»‡ tha»‘ng:": "System error:",
    "Leaf»—i phha:": "Error fetching reservation:",
    "Ha»§y Ä‘áº·t chá»— so also": "Reservation cancelled successfully",
    
    # VehicleController
    "Leaf»—i:": "Error:",
    "ÄÃ£ price of the book list": "Vehicles fetched successfully",
    
    # GateOperationService
    "Äáº¶T TRÆ¯á»šC": "PREBOOKED",
    "VUONG LAI": "STANDARD",
    "Area patch»±c Ta»± due": "Default Zone",
    
    # ReservationService
    "Type of vehicle that is not suitable for use‡": "Invalid vehicle type",
    
    # ZoneMonitoringService
    "Detection of wrong vehicle in Zone ThÃ¡ng": "Wrong zone violation detected in Zone ",
    "e Please check it out!": ". Please check!",
    
    # BuildingProfileController
    "What's the point? ": "Update building profile",
    
    # SystemConfigService
    "Tá»± Ä‘á»™ng Táº¡o": "Auto Generate"
}

# Add some exact string replacements for the weird "ÄÃ£ dozen»« chá»‘i or ti»n" where space is a non-breaking space
fixes["ÄÃ£ dozen»« chá»‘i or\u00a0ti»n"] = "Refund rejected successfully"

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        modified = False
        for bad, good in fixes.items():
            if bad in content:
                content = content.replace(bad, good)
                modified = True
                
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {filepath}")
    except Exception as e:
        print(f"Failed {filepath}: {e}")

for filepath in data.keys():
    replace_in_file(filepath)

print("Done")
