<?php

namespace App\Http\Controllers\Address;

use App\Http\Controllers\Controller;
use App\Http\Requests\Address\StoreAddressRequest;
use App\Http\Requests\Address\UpdateAddressRequest;
use App\Models\Address;
use App\Services\Address\AddressService;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function __construct(
        private AddressService $addressService
    ) {}

    public function index(Request $request)
    {
        $addresses = $this->addressService->getMyAddresses($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách địa chỉ thành công.',
            'data' => [
                'addresses' => $addresses,
            ],
        ]);
    }

    public function store(StoreAddressRequest $request)
    {
        $address = $this->addressService->create(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Thêm địa chỉ thành công.',
            'data' => [
                'address' => $address,
            ],
        ], 201);
    }

    public function update(UpdateAddressRequest $request, Address $address)
    {
        $address = $this->addressService->update(
            $request->user(),
            $address,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật địa chỉ thành công.',
            'data' => [
                'address' => $address,
            ],
        ]);
    }

    public function destroy(Request $request, Address $address)
    {
        $this->addressService->delete(
            $request->user(),
            $address
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa địa chỉ thành công.',
        ]);
    }

    public function setDefault(Request $request, Address $address)
    {
        $address = $this->addressService->setDefault(
            $request->user(),
            $address
        );

        return response()->json([
            'success' => true,
            'message' => 'Đặt địa chỉ mặc định thành công.',
            'data' => [
                'address' => $address,
            ],
        ]);
    }
}