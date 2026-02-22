<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('branch')->latest()->get();

        return Inertia::render('users/index', [
            'users' => $users,
            'branches' => Branch::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'role' => 'required|in:admin,kasir',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $validated['password'] = bcrypt($validated['password']);

        User::create($validated);

        return redirect()->route('users.index');
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'role' => 'required|in:admin,kasir',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        User::where('id', $id)->update($validated);

        return redirect()->route('users.index');
    }

    public function destroy(string $id)
    {
        User::where('id', $id)->delete();

        return redirect()->route('users.index');
    }
}
