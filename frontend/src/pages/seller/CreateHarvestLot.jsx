import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import harvestLotService from "../../services/harvestLotService";
import productService from "../../services/productService";

function CreateHarvestLot() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product_id: "",
    lot_code: "",
    harvest_date: "",
    expiry_date: "",
    quantity_imported: "",
    note: "",
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    setLoadingProducts(true);

    try {
      const res = await productService.getProductsForHarvestLot();
      setProducts(res.data || []);
    } catch (err) {
      setError(err.error || "Không thể tải danh sách sản phẩm.");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    if (name === "product_id") {
      const product = products.find((item) => String(item.id) === String(value));
      setSelectedProduct(product || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        product_id: Number(form.product_id),
        lot_code: form.lot_code,
        harvest_date: form.harvest_date,
        expiry_date: form.expiry_date,
        quantity_imported: Number(form.quantity_imported),
        note: form.note || null,
      };

      await harvestLotService.createHarvestLot(payload);

      alert("Tạo lô sản phẩm thành công.");
      navigate("/seller/harvest-lots");
    } catch (err) {
      setError(err.error || "Tạo lô thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Thêm lô sản phẩm</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Sản phẩm</label>
          <select
            name="product_id"
            value={form.product_id}
            onChange={handleChange}
            style={{ width: "100%", padding: 10 }}
          >
            <option value="">
              {loadingProducts ? "Đang tải sản phẩm..." : "Chọn sản phẩm"}
            </option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div
            style={{
              padding: 12,
              background: "#f5f5f5",
              marginBottom: 12,
            }}
          >
            <p>
              <b>Đơn vị tính:</b> {selectedProduct.unit}
            </p>

            <p>
              <b>Tồn kho hiện tại:</b> {selectedProduct.stock_quantity}
            </p>

            <p>
              <b>Chứng chỉ:</b>{" "}
              {selectedProduct.certificate?.certification_name} -{" "}
              {selectedProduct.certificate?.certificate_number}
            </p>

            <p>
              <b>Hạn chứng chỉ:</b>{" "}
              {selectedProduct.certificate?.expiry_date}
            </p>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label>Mã lô</label>
          <input
            type="text"
            name="lot_code"
            value={form.lot_code}
            onChange={handleChange}
            placeholder="VD: LO001"
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Ngày thu hoạch</label>
          <input
            type="date"
            name="harvest_date"
            value={form.harvest_date}
            onChange={handleChange}
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Hạn sử dụng</label>
          <input
            type="date"
            name="expiry_date"
            value={form.expiry_date}
            onChange={handleChange}
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Số lượng nhập</label>
          <input
            type="number"
            name="quantity_imported"
            value={form.quantity_imported}
            onChange={handleChange}
            placeholder="VD: 100"
            min="1"
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Ghi chú</label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="Ghi chú lô hàng"
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Đang tạo..." : "Tạo lô"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/seller/harvest-lots")}
          style={{ marginLeft: 8 }}
        >
          Hủy
        </button>
      </form>
    </div>
  );
}

export default CreateHarvestLot;