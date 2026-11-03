export interface CustomerAddress {
  id: string;
  label: string;
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  district: string;
  stateCode: string;
  postalCode: string;
  countryCode: string;
  defaultAddress: boolean;
}

export type CustomerAddressRequest = Omit<CustomerAddress, 'id' | 'defaultAddress'>;
