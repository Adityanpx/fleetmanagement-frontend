export type Status = 'scheduled' | 'running' | 'completed' | 'cancelled';
export type PaidBy = 'ourselves' | 'company' | 'driver';
export type Mode = 'cash' | 'upi' | 'bank' | 'card';
export type Category =
  | 'advance' | 'diesel' | 'toll' | 'food' | 'fine'
  | 'parking' | 'loading_unloading' | 'tyre' | 'repair' | 'other';

export interface Vehicle { id: number; number: string; brand: string; model?: string | null; year?: number | null;
  emi_amount?: number | null; emi_due_day?: number | null; insurance_expiry?: string | null; fitness_expiry?: string | null;
  permit_expiry?: string | null; puc_expiry?: string | null; is_active: boolean; }
export interface Driver { id: number; name: string; phone?: string | null; license_number?: string | null;
  license_expiry?: string | null; salary?: number | null; is_active: boolean; balance?: number; }
export interface Company { id: number; name: string; contact_person?: string | null; phone?: string | null;
  deduct_diesel_default: boolean; is_active: boolean; }
export interface Trip { id: number; vehicle_id: number; driver_id?: number | null; company_id?: number | null;
  vehicle_number?: string; driver_name?: string | null; company_name?: string | null; cargo?: string | null; quantity?: number | null;
  start_date: string; start_location: string; expected_end_date?: string | null; expected_end_location?: string | null;
  actual_end_date?: string | null; actual_end_location?: string | null; start_odometer?: number | null; end_odometer?: number | null;
  freight_amount: number; deduct_company_diesel: boolean; status: Status; cancel_reason?: string | null; notes?: string | null;
  income?: number; owner_cost?: number; profit?: number; received?: number; pending?: number;
  company_diesel?: number; km?: number | null; diesel_litres?: number; }
export interface Expense { id: number; trip_id: number; category: Category; amount: number;
  expense_date: string; paid_by: PaidBy; company_id?: number | null; mode?: Mode | null; vendor_name?: string | null;
  note?: string | null; litres?: number | null; rate?: number | null; fill_location?: string | null; work_detail?: string | null; }
export interface Payment { id: number; trip_id: number; amount: number; payment_date: string; mode?: Mode | null; note?: string | null; }
export type TripDetail = Trip & { expenses: Expense[]; payments: Payment[] };

/** Delete endpoints for vehicles/drivers/companies deactivate instead when the record has trips. */
export interface DeleteResult { deleted?: boolean; softDeleted?: boolean; }

export interface DashboardData {
  tiles: { running_trips: number; total_trips: number; total_income: number; total_cost: number;
    total_profit: number; total_pending: number; diesel_cost: number; };
  expensesByCategory: { category: Category; total: number }[];
  profitByVehicle: { id: number; number: string; brand: string; profit: number }[];
  monthly: { month: string; income: number; cost: number; profit: number }[];
  runningTrips: { id: number; vehicle_number: string; company_name: string | null;
    start_location: string; expected_end_location: string | null; owner_cost: number }[];
  documentExpiries: (Pick<Vehicle, 'id' | 'number' | 'brand' | 'insurance_expiry' | 'fitness_expiry' | 'permit_expiry' | 'puc_expiry'>)[];
  driverDues: { id: number; name: string; balance: number }[];
}
