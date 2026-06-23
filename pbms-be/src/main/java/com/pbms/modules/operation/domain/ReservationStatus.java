package com.pbms.modules.operation.domain;

import java.util.Set;

public final class ReservationStatus {

    public static final String PAID = "PAID";
    public static final String IN_PARKING = "IN_PARKING";
    public static final String COMPLETED = "COMPLETED";
    public static final String COMPLETED_UNUSED = "COMPLETED_UNUSED";   //Chỗ đã kết thúc nhưng khách không sử dụng.
    public static final String PENDING_FULL_REFUND = "PENDING_FULL_REFUND"; //Chờ hoàn 100%.
    public static final String PENDING_HALF_REFUND = "PENDING_HALF_REFUND"; //Chờ hoàn 50%.
    public static final String CANCELLED_NO_REFUND = "CANCELLED_NO_REFUND"; //Đã hủy và không hoàn tiền.

    public static final Set<String> SLOT_BLOCKING = Set.of(PAID, IN_PARKING);

    private ReservationStatus() {
    }
}
