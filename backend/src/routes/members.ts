import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type { Member, ApiResponse } from '../types';

const router = Router();

// Get members
router.get('/', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { is_active } = req.query;
    
    let query = supabase
      .from('members')
      .select('*')
      .order('name', { ascending: true });

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    const response: ApiResponse<Member[]> = {
      success: true,
      data: data as Member[]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch members'
    });
  }
});

// Get member profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const member_id = req.user!.id;

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', member_id)
      .single();

    if (error) throw error;

    const response: ApiResponse<Member> = {
      success: true,
      data: data as Member
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching member profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member profile'
    });
  }
});

// Update member profile
router.patch('/profile', authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const member_id = req.user!.id;
    const { name, phone } = req.body;

    const updateData: Partial<Member> = {
      updated_at: new Date().toISOString()
    };

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', member_id)
      .select()
      .single();

    if (error) throw error;

    const response: ApiResponse<Member> = {
      success: true,
      data: data as Member,
      message: 'Profile updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating member profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member profile'
    });
  }
});

export default router;