import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useUserAuth = (navigate, setSnackbar) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setSnackbar({ open: true, message: 'Please sign in to submit a project', severity: 'warning' });
                navigate('/UserRegister');
                return;
            }
            setUser(user);
        };
        checkUser();
    }, [navigate, setSnackbar]);

    return user;
};

