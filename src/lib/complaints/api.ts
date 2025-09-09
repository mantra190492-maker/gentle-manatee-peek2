// src/lib/complaints/api.ts

interface ComplaintCounts {
  open: number;
  critical: number;
  total: number;
}

/**
 * Mock function to get complaint counts.
 * In a real application, this would fetch data from Supabase.
 */
export async function getComplaintCounts(): Promise<ComplaintCounts> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Mock data
  return {
    open: 5,
    critical: 1,
    total: 12,
  };
}