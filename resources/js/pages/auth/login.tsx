import { FormEvent, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';

type Props = {
    status?: string;
};

export default function Login({ status }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div
            className="min-h-screen overflow-hidden bg-[#fdfbf7] text-slate-800 antialiased transition-colors duration-300 dark:bg-[#1c1917] dark:text-stone-200"
            style={{ fontFamily: '"Manrope", sans-serif' }}
        >
            <Head title="Login">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
                <div className="absolute inset-0 z-0 bg-[#f5f5f4] dark:bg-[#1c1917]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-stone-200/50 via-transparent to-transparent dark:from-stone-800/30"></div>
                    <div
                        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                    ></div>
                </div>

                <div className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-2xl border border-stone-100 bg-[#ffffff] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),_0_10px_10px_-5px_rgba(0,0,0,0.01)] dark:border-stone-700/50 dark:bg-[#292524]">
                    <div className="px-8 pt-10 pb-2 text-center">
                        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#334155] text-white shadow-lg shadow-[#334155]/20">
                            <span className="material-symbols-outlined text-2xl">
                                storefront
                            </span>
                        </div>
                        <h2 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-stone-100">
                            POSLING
                        </h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-stone-400">
                            Log in untuk kelola penjualan
                        </p>
                    </div>

                    <div className="p-8">
                        {status && (
                            <div className="mb-4 text-center text-sm font-medium text-green-600">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label
                                    className="text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-stone-400"
                                    htmlFor="email"
                                >
                                    Email
                                </label>
                                <div className="group relative flex items-center">
                                    <span className="absolute left-0 pl-3 text-slate-400 transition-colors group-focus-within:text-[#334155]">
                                        <span className="material-symbols-outlined text-[20px]">
                                            alternate_email
                                        </span>
                                    </span>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="name@company.com"
                                        className={`h-11 w-full rounded-lg border bg-stone-50 pr-4 pl-10 dark:bg-stone-900/50 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-stone-200 focus:border-[#334155] focus:ring-[#334155] dark:border-stone-700'} text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:ring-1 dark:text-stone-100`}
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        required
                                        autoFocus
                                    />
                                </div>
                                {errors.email && (
                                    <div className="mt-1 text-xs text-red-500">
                                        {errors.email}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-end justify-between">
                                    <label
                                        className="text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-stone-400"
                                        htmlFor="password"
                                    >
                                        Password
                                    </label>
                                </div>
                                <div className="group relative flex items-center">
                                    <span className="absolute left-0 pl-3 text-slate-400 transition-colors group-focus-within:text-[#334155]">
                                        <span className="material-symbols-outlined text-[20px]">
                                            key
                                        </span>
                                    </span>
                                    <input
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        className={`h-11 w-full rounded-lg border bg-stone-50 pr-10 pl-10 dark:bg-stone-900/50 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-stone-200 focus:border-[#334155] focus:ring-[#334155] dark:border-stone-700'} text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:ring-1 dark:text-stone-100`}
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-0 flex items-center justify-center pr-3 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none dark:hover:text-stone-200"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword
                                                ? 'visibility'
                                                : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="mt-1 text-xs text-red-500">
                                        {errors.password}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#334155] font-semibold text-white shadow-md shadow-stone-900/10 transition-all hover:bg-[#1e293b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
                            >
                                <span>
                                    {processing ? 'Signing In...' : 'Sign In'}
                                </span>
                            </button>
                        </form>

                        <div className="mt-8 flex flex-col items-center gap-4 border-t border-stone-100 pt-6 dark:border-stone-800">
                            <div className="flex gap-6 text-xs font-medium text-slate-500 dark:text-stone-500">
                                <a
                                    href="#"
                                    className="transition-colors hover:text-[#334155] dark:hover:text-stone-300"
                                >
                                    Terms
                                </a>
                                <a
                                    href="#"
                                    className="transition-colors hover:text-[#334155] dark:hover:text-stone-300"
                                >
                                    Privacy
                                </a>
                                <a
                                    href="#"
                                    className="transition-colors hover:text-[#334155] dark:hover:text-stone-300"
                                >
                                    Help
                                </a>
                            </div>
                            <p className="text-[10px] tracking-widest text-slate-400 uppercase dark:text-stone-600">
                                © 2026 Aling POS
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
