<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;

class ProductImageSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Product::all() as $product) {

            ProductImage::create([
                'product_id' => $product->id,
                'image_url'  => $product->thumbnail,
                'created_at' => $product->created_at,
                'updated_at' => $product->created_at,
            ]);
        }
    }
}