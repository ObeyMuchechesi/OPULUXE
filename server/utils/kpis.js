import Booking from "../models/Booking.js";
import { catDateStr, catNow, pad2 } from "./time.js";

const monthKeyOf = (d) => `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;

export async function computeKpis() {
  const today = catDateStr(0);
  const now = catNow();
  const thisMonth = monthKeyOf(now);
  const lastM = new Date(now);
  lastM.setUTCDate(1);
  lastM.setUTCMonth(lastM.getUTCMonth() - 1);
  const lastMonth = monthKeyOf(lastM);
  const in7 = catDateStr(6);

  const [revByMonth, bookingsByMonth, topServices, repeatAgg, completed, cancelled, pending, upcoming7, revenueAll] =
    await Promise.all([
      Booking.aggregate([
        { $match: { status: "completed" } },
        { $addFields: { month: { $substr: ["$date", 0, 7] } } },
        { $group: { _id: "$month", revenue: { $sum: "$price" } } },
      ]),
      Booking.aggregate([
        { $addFields: { month: { $substr: ["$date", 0, 7] } } },
        { $group: { _id: "$month", bookings: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: "$serviceName", count: { $sum: 1 }, revenue: { $sum: "$price" } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Booking.aggregate([
        { $group: { _id: "$phone", c: { $sum: 1 } } },
        { $match: { c: { $gt: 1 } } },
        { $count: "repeat" },
      ]),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ date: { $gte: today, $lte: in7 }, status: { $ne: "cancelled" } }),
      Booking.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, revenue: { $sum: "$price" } } },
      ]),
    ]);

  const totalCustomers = (await Booking.distinct("phone")).length;

  const revMap = new Map(revByMonth.map((r) => [r._id, r.revenue]));
  const bkMap = new Map(bookingsByMonth.map((r) => [r._id, r.bookings]));

  const series = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - i);
    const key = monthKeyOf(d);
    series.push({ month: key, revenue: revMap.get(key) || 0, bookings: bkMap.get(key) || 0 });
  }

  const revenueThisMonth = revMap.get(thisMonth) || 0;
  const revenueLastMonth = revMap.get(lastMonth) || 0;
  const bookingsThisMonth = bkMap.get(thisMonth) || 0;
  const bookingsLastMonth = bkMap.get(lastMonth) || 0;
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0);

  return {
    generatedAt: new Date().toISOString(),
    revenueThisMonth,
    revenueLastMonth,
    revenueDeltaPct: pct(revenueThisMonth, revenueLastMonth),
    bookingsThisMonth,
    bookingsLastMonth,
    bookingsDeltaPct: pct(bookingsThisMonth, bookingsLastMonth),
    avgTicket: completed ? Math.round((revenueAll[0]?.revenue || 0) / completed) : 0,
    completionRate: completed + cancelled ? Math.round((completed / (completed + cancelled)) * 100) : 100,
    completed,
    cancelled,
    pending,
    upcoming7,
    repeatCustomers: repeatAgg[0]?.repeat || 0,
    totalCustomers,
    topServices: topServices.map((t) => ({ name: t._id, count: t.count, revenue: t.revenue })),
    revenueSeries: series,
  };
}
