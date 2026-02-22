export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    role: 'admin' | 'kasir';
    branch_id: number | null;
    branch?: Branch;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Branch = {
    id: number;
    name: string;
    address?: string;
    phone?: string;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
