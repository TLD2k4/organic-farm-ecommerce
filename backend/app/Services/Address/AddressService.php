<?php

namespace App\Services\Address;

use App\Models\Address;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AddressService
{
    public function getMyAddresses(User $user): Collection
    {
        return Address::where('user_id', $user->id)
            ->orderByDesc('is_default')
            ->latest()
            ->get();
    }

    public function create(User $user, array $data): Address
    {
        return DB::transaction(function () use ($user, $data) {
            $hasAddress = Address::where('user_id', $user->id)->exists();

            $isDefault = (bool) ($data['is_default'] ?? false);

            // Địa chỉ đầu tiên tự động là mặc định
            if (!$hasAddress) {
                $isDefault = true;
            }

            // Nếu chọn mặc định, bỏ mặc định các địa chỉ khác
            if ($isDefault) {
                $this->clearDefaultAddresses($user);
            }

            return Address::create([
                'user_id' => $user->id,
                'receiver_name' => $data['receiver_name'],
                'phone' => $data['phone'],
                'address_line' => $data['address_line'],
                'ward' => $data['ward'] ?? null,
                'district' => $data['district'] ?? null,
                'province' => $data['province'] ?? null,
                'is_default' => $isDefault,
            ]);
        });
    }

    public function update(User $user, Address $address, array $data): Address
    {
        $this->ensureOwner($user, $address);

        return DB::transaction(function () use ($user, $address, $data) {
            $isDefault = $address->is_default;

            if (array_key_exists('is_default', $data)) {
                $isDefault = (bool) $data['is_default'];

                if ($isDefault) {
                    Address::where('user_id', $user->id)
                        ->where('id', '!=', $address->id)
                        ->update(['is_default' => false]);
                }
            }

            $address->update([
                'receiver_name' => $data['receiver_name'] ?? $address->receiver_name,
                'phone' => $data['phone'] ?? $address->phone,
                'address_line' => $data['address_line'] ?? $address->address_line,
                'ward' => array_key_exists('ward', $data) ? $data['ward'] : $address->ward,
                'district' => array_key_exists('district', $data) ? $data['district'] : $address->district,
                'province' => array_key_exists('province', $data) ? $data['province'] : $address->province,
                'is_default' => $isDefault,
            ]);

            $this->ensureHasDefaultAddress($user);

            return $address->fresh();
        });
    }

    public function delete(User $user, Address $address): void
    {
        $this->ensureOwner($user, $address);

        DB::transaction(function () use ($user, $address) {
            $wasDefault = $address->is_default;

            $address->delete();

            if ($wasDefault) {
                $this->setLatestAddressAsDefault($user);
            }
        });
    }

    public function setDefault(User $user, Address $address): Address
    {
        $this->ensureOwner($user, $address);

        return DB::transaction(function () use ($user, $address) {
            $this->clearDefaultAddresses($user);

            $address->update([
                'is_default' => true,
            ]);

            return $address->fresh();
        });
    }

    private function ensureOwner(User $user, Address $address): void
    {
        if ((int) $address->user_id !== (int) $user->id) {
            throw new AuthorizationException('Bạn không có quyền thao tác địa chỉ này.');
        }
    }

    private function clearDefaultAddresses(User $user): void
    {
        Address::where('user_id', $user->id)
            ->update(['is_default' => false]);
    }

    private function ensureHasDefaultAddress(User $user): void
    {
        $hasDefault = Address::where('user_id', $user->id)
            ->where('is_default', true)
            ->exists();

        if (!$hasDefault) {
            $this->setLatestAddressAsDefault($user);
        }
    }

    private function setLatestAddressAsDefault(User $user): void
    {
        $newDefault = Address::where('user_id', $user->id)
            ->latest()
            ->first();

        if ($newDefault) {
            $newDefault->update([
                'is_default' => true,
            ]);
        }
    }
}