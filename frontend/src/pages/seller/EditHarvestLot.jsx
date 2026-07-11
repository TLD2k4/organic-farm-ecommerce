import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import harvestLotService from "../../services/harvestLotService";

function EditHarvestLot() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    harvest_date: "",
    expiry_date: "",
    quantity_imported: "",
    status: 1,
    note: "",
  });

  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchDetail = async () => {
    setLoading(true);

    try {
      const res = await harvestLotService.getHarvestLotDetail(id);
      const data = res.data;

      setLot(data);
      setForm({
        harvest_date: data.harvest_date || "",
        expiry_date: data.expiry_date || "",
        quantity_imported: data.quantity_imported || "",
        status: data.status || 1,
        note: data.note || "",
      });
    } catch (err) {
      setError(err.error || "Không thể tải chi tiết lô.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        harvest_date: form.harvest_date,
        expiry_date: form.expiry_date,
        quantity_imported: Number(form.quantity_imported),
        status: Number(form.status),
        note: form.note || null,
      };

      await harvestLotService.updateHarvestLot(id, payload);

      alert("Cập nhật lô thành công.");
      navigate("/seller/harvest-lots");
    } catch (err) {
      setError(err.error || "Cập nhật lô thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <div>
      <h2>Cập nhật lô sản phẩm</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {lot && (
        <div
          style={{
            padding: 12,
            background: "#f5f5f5",
            marginBottom: 12,
          }}
        >
          <p>
            <b>Mã lô:</b> {lot.lot_code}
          </p>
          <p>
            <b>Sản phẩm:</b> {lot.product?.name}
          </p>
          <p>
            <b>Đã bán:</b> {lot.quantity_sold}
          </p>
          <p>
            <b>Còn lại:</b> {lot.quantity_remaining}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
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
            min="1"
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Trạng thái</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            style={{ width: "100%", padding: 10 }}
          >
            <option value={1}>Đang bán</option>
            <option value={2}>Tạm ẩn</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Ghi chú</label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Đang lưu..." : "Lưu thay đổi"}
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

export default EditHarvestLot;