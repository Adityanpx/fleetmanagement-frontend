import toast from 'react-hot-toast';
import { api } from './api';
import type { DeleteResult } from './types';

/** Deletes a vehicle/company; the backend deactivates instead if it has trips. */
export async function removeRecord(path: string, noun: string) {
  try {
    const res: DeleteResult = await api.del(path);
    if (res.softDeleted) toast.success(`${noun} has trips, so it was deactivated instead`);
    else toast.success(`${noun} deleted`);
    return true;
  } catch (e) {
    toast.error((e as Error).message);
    return false;
  }
}
