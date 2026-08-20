export interface AvailabilityDay {
  open: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface Availability {
  alwaysAvailable?: boolean;
  byAppointment?: boolean;

  monday?: AvailabilityDay;
  tuesday?: AvailabilityDay;
  wednesday?: AvailabilityDay;
  thursday?: AvailabilityDay;
  friday?: AvailabilityDay;
  saturday?: AvailabilityDay;
  sunday?: AvailabilityDay;
}
