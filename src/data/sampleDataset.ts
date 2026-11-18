import { AdPod, BreakType, SpotDuration } from '../engine/types';
import { findBrandByName, SYNTHETIC_BRANDS } from './syntheticBrands';

// The complete sample CSV dataset provided by the broadcaster
export const SAMPLE_DATASET_CSV = `Pod_ID,Innings,Over_No,Break_Type,Timestamp,Slot_No,Brand_Name,Category,Duration_Sec
POD_01,1,1,Over_Break,07:32:48,1,Dove,Personal_Care,15
POD_01,1,1,Over_Break,07:33:03,2,Unacademy,EdTech,30
POD_01,1,1,Over_Break,07:33:33,3,Vimal,FMCG,15
POD_02,1,2,Over_Break,07:36:58,1,Hyundai,Auto,30
POD_02,1,2,Over_Break,07:37:28,2,Samsung,Electronics,30
POD_03,1,3,Over_Break,07:40:30,1,Oppo,Electronics,30
POD_03,1,3,Over_Break,07:41:00,2,Booking_Com,Travel,30
POD_04,1,4,Over_Break,07:44:13,1,Boat,Electronics,30
POD_04,1,4,Over_Break,07:44:43,2,Myntra,Ecommerce,30
POD_05,1,5,Wicket_Break,07:46:28,1,Flipkart,Ecommerce,15
POD_05,1,5,Wicket_Break,07:46:43,2,Cadbury,Dairy_Food,15
POD_05,1,5,Wicket_Break,07:46:58,3,My11Circle,Gaming,30
POD_05,1,5,Wicket_Break,07:47:28,4,Airtel,Telecom,30
POD_06,1,5,Over_Break,07:49:13,1,LIC,Insurance,30
POD_06,1,5,Over_Break,07:49:43,2,Jio,Telecom,30
POD_07,1,6,Over_Break,07:53:06,1,Myntra,Ecommerce,30
POD_07,1,6,Over_Break,07:53:36,2,Vi,Telecom,30
POD_08,1,7,Wicket_Break,07:55:42,1,CEAT_Tyres,Tyres,15
POD_08,1,7,Wicket_Break,07:55:57,2,Zomato,Food_Delivery,30
POD_08,1,7,Wicket_Break,07:56:27,3,Hotstar_LiveStream_Promo,Channel_Promo,30
POD_08,1,7,Wicket_Break,07:56:57,4,Vivo,Electronics,15
POD_09,1,7,Over_Break,07:58:45,1,RuPay,Fintech,15
POD_09,1,7,Over_Break,07:59:00,2,Berger_Paints,Home_Decor,30
POD_09,1,7,Over_Break,07:59:30,3,Nivea,Personal_Care,15
POD_10,1,8,Wicket_Break,08:00:15,1,Paytm,Fintech,30
POD_10,1,8,Wicket_Break,08:00:45,2,Myntra,Ecommerce,15
POD_10,1,8,Wicket_Break,08:01:00,3,Ambuja_Cement,Construction,30
POD_10,1,8,Wicket_Break,08:01:30,4,Airtel,Telecom,15
POD_11,1,8,Over_Break,08:04:17,1,Maruti_Suzuki,Auto,30
POD_11,1,8,Over_Break,08:04:47,2,Sprite,Beverage,30
POD_12,1,9,Over_Break,08:07:51,1,LIC,Insurance,45
POD_12,1,9,Over_Break,08:08:36,2,Britannia,Dairy_Food,15
POD_13,1,10,Over_Break,08:12:19,1,Amul,Dairy_Food,15
POD_13,1,10,Over_Break,08:12:34,2,Oppo,Electronics,30
POD_13,1,10,Over_Break,08:13:04,3,Zomato,Food_Delivery,15
POD_14,1,11,Over_Break,08:15:55,1,Vivo,Electronics,15
POD_14,1,11,Over_Break,08:16:10,2,Cadbury,Dairy_Food,15
POD_14,1,11,Over_Break,08:16:25,3,PhysicsWallah,EdTech,30
POD_15,1,12,Over_Break,08:19:28,1,MakeMyTrip,Travel,15
POD_15,1,12,Over_Break,08:19:43,2,Dream11,Gaming,15
POD_15,1,12,Over_Break,08:19:58,3,Berger_Paints,Home_Decor,30
POD_16,1,13,Over_Break,08:23:58,1,Zomato,Food_Delivery,15
POD_16,1,13,Over_Break,08:24:13,2,Jio,Telecom,45
POD_17,1,14,Over_Break,08:28:15,1,Vimal,FMCG,30
POD_17,1,14,Over_Break,08:28:45,2,Vi,Telecom,30
POD_18,1,15,Over_Break,08:32:45,1,MPL,Gaming,15
POD_18,1,15,Over_Break,08:33:00,2,Thums_Up,Beverage,30
POD_18,1,15,Over_Break,08:33:30,3,Oppo,Electronics,15
POD_19,1,16,Over_Break,08:36:57,1,UltraTech_Cement,Construction,30
POD_19,1,16,Over_Break,08:37:27,2,Tata_Motors,Auto,30
POD_20,1,17,Wicket_Break,08:38:47,1,Maruti_Suzuki,Auto,45
POD_20,1,17,Wicket_Break,08:39:32,2,MakeMyTrip,Travel,30
POD_20,1,17,Wicket_Break,08:40:02,3,PhysicsWallah,EdTech,15
POD_21,1,17,Over_Break,08:41:57,1,Oppo,Electronics,30
POD_21,1,17,Over_Break,08:42:27,2,Amul,Dairy_Food,30
POD_22,1,18,Over_Break,08:45:50,1,Hyundai,Auto,45
POD_22,1,18,Over_Break,08:46:35,2,Swiggy,Food_Delivery,15
POD_23,1,19,Over_Break,08:49:57,1,CRED,Fintech,30
POD_23,1,19,Over_Break,08:50:27,2,Berger_Paints,Home_Decor,30
POD_24,1,20,Over_Break,08:53:34,1,RuPay,Fintech,15
POD_24,1,20,Over_Break,08:53:49,2,Vivo,Electronics,15
POD_24,1,20,Over_Break,08:54:04,3,Dove,Personal_Care,30
POD_25,1,21,Over_Break,08:57:12,1,Flipkart,Ecommerce,30
POD_25,1,21,Over_Break,08:57:42,2,Hotstar_LiveStream_Promo,Channel_Promo,30
POD_26,1,22,Strategic_Timeout,08:58:12,1,ACKO,Insurance,15
POD_26,1,22,Strategic_Timeout,08:58:27,2,Unacademy,EdTech,15
POD_26,1,22,Strategic_Timeout,08:58:42,3,Ambuja_Cement,Construction,30
POD_26,1,22,Strategic_Timeout,08:59:12,4,My11Circle,Gaming,30
POD_26,1,22,Strategic_Timeout,08:59:42,5,Boat,Electronics,30
POD_26,1,22,Strategic_Timeout,09:00:12,6,StarSports_MatchPromo,Channel_Promo,15
POD_26,1,22,Strategic_Timeout,09:00:27,7,Hyundai,Auto,45
POD_26,1,22,Strategic_Timeout,09:01:12,8,Apollo_Tyres,Tyres,15
POD_26,1,22,Strategic_Timeout,09:01:27,9,Asian_Paints,Home_Decor,30
POD_26,1,22,Strategic_Timeout,09:01:57,10,Britannia,Dairy_Food,15
POD_26,1,22,Strategic_Timeout,09:02:12,11,Booking_Com,Travel,15
POD_26,1,22,Strategic_Timeout,09:02:27,12,Sprite,Beverage,15
POD_26,1,22,Strategic_Timeout,09:02:42,13,Vimal,FMCG,30
POD_27,1,22,Over_Break,09:06:05,1,Coca-Cola,Beverage,30
POD_27,1,22,Over_Break,09:06:35,2,RuPay,Fintech,30
POD_28,1,23,Over_Break,09:09:56,1,Amul,Dairy_Food,30
POD_28,1,23,Over_Break,09:10:26,2,Paytm,Fintech,30
POD_29,1,24,Wicket_Break,09:13:43,1,Boat,Electronics,15
POD_29,1,24,Wicket_Break,09:13:58,2,Asian_Paints,Home_Decor,30
POD_29,1,24,Wicket_Break,09:14:28,3,Thums_Up,Beverage,30
POD_29,1,24,Wicket_Break,09:14:58,4,Myntra,Ecommerce,15
POD_30,1,24,Over_Break,09:15:14,1,Berger_Paints,Home_Decor,30
POD_30,1,24,Over_Break,09:15:44,2,ACKO,Insurance,30
POD_31,1,25,Over_Break,09:19:41,1,Kamla_Pasand,FMCG,30
POD_31,1,25,Over_Break,09:20:11,2,CRED,Fintech,30
POD_32,1,26,Over_Break,09:23:18,1,Boat,Electronics,15
POD_32,1,26,Over_Break,09:23:33,2,Booking_Com,Travel,30
POD_32,1,26,Over_Break,09:24:03,3,Broadcaster_Highlight_Bumper,Channel_Promo,15
POD_33,1,27,Over_Break,09:27:45,1,Berger_Paints,Home_Decor,30
POD_33,1,27,Over_Break,09:28:15,2,Amazon,Ecommerce,30
POD_34,1,28,Over_Break,09:31:52,1,Apollo_Tyres,Tyres,15
POD_34,1,28,Over_Break,09:32:07,2,Mahindra,Auto,30
POD_34,1,28,Over_Break,09:32:37,3,Amul,Dairy_Food,15
POD_35,1,29,Over_Break,09:35:42,1,MPL,Gaming,15
POD_35,1,29,Over_Break,09:35:57,2,Swiggy,Food_Delivery,30
POD_35,1,29,Over_Break,09:36:27,3,Hotstar_LiveStream_Promo,Channel_Promo,15
POD_36,1,30,Over_Break,09:40:05,1,Asian_Paints,Home_Decor,30
POD_36,1,30,Over_Break,09:40:35,2,Vimal,FMCG,30
POD_37,1,31,Over_Break,09:44:27,1,Unacademy,EdTech,15
POD_37,1,31,Over_Break,09:44:42,2,Sprite,Beverage,30
POD_37,1,31,Over_Break,09:45:12,3,Amul,Dairy_Food,15
POD_38,1,32,Over_Break,09:47:58,1,Apollo_Tyres,Tyres,15
POD_38,1,32,Over_Break,09:48:13,2,Mahindra,Auto,30
POD_38,1,32,Over_Break,09:48:43,3,Booking_Com,Travel,15
POD_39,1,33,Wicket_Break,09:50:06,1,Vimal,FMCG,30
POD_39,1,33,Wicket_Break,09:50:36,2,Maruti_Suzuki,Auto,45
POD_39,1,33,Wicket_Break,09:51:21,3,MakeMyTrip,Travel,15
POD_40,1,33,Over_Break,09:53:54,1,Coca-Cola,Beverage,45
POD_40,1,33,Over_Break,09:54:39,2,Swiggy,Food_Delivery,15
POD_41,1,34,Over_Break,09:58:18,1,CRED,Fintech,45
POD_41,1,34,Over_Break,09:59:03,2,Boat,Electronics,15
POD_42,1,35,Wicket_Break,10:00:26,1,Kamla_Pasand,FMCG,15
POD_42,1,35,Wicket_Break,10:00:41,2,ACKO,Insurance,30
POD_42,1,35,Wicket_Break,10:01:11,3,Samsung,Electronics,45
POD_43,1,35,Over_Break,10:04:11,1,RuPay,Fintech,30
POD_43,1,35,Over_Break,10:04:41,2,Maruti_Suzuki,Auto,30
POD_44,1,35,Wicket_Break,10:06:19,1,Sprite,Beverage,30
POD_44,1,35,Wicket_Break,10:06:49,2,CRED,Fintech,45
POD_44,1,35,Wicket_Break,10:07:34,3,Apollo_Tyres,Tyres,15
POD_45,1,35,Over_Break,10:10:04,1,Kamla_Pasand,FMCG,30
POD_45,1,35,Over_Break,10:10:34,2,PhonePe,Fintech,30
POD_46,1,36,Strategic_Timeout,10:11:04,1,Jio,Telecom,45
POD_46,1,36,Strategic_Timeout,10:11:49,2,Britannia,Dairy_Food,30
POD_46,1,36,Strategic_Timeout,10:12:19,3,StarSports_MatchPromo,Channel_Promo,30
POD_46,1,36,Strategic_Timeout,10:12:49,4,Dove,Personal_Care,30
POD_46,1,36,Strategic_Timeout,10:13:19,5,MRF_Tyres,Tyres,30
POD_46,1,36,Strategic_Timeout,10:13:49,6,Oppo,Electronics,15
POD_46,1,36,Strategic_Timeout,10:14:04,7,UltraTech_Cement,Construction,30
POD_46,1,36,Strategic_Timeout,10:14:34,8,Coca-Cola,Beverage,30
POD_46,1,36,Strategic_Timeout,10:15:04,9,MPL,Gaming,15
POD_46,1,36,Strategic_Timeout,10:15:19,10,Tata_Motors,Auto,45
POD_47,1,36,Wicket_Break,10:16:36,1,Broadcaster_Highlight_Bumper,Channel_Promo,15
POD_47,1,36,Wicket_Break,10:16:51,2,Apollo_Tyres,Tyres,15
POD_47,1,36,Wicket_Break,10:17:06,3,Samsung,Electronics,45
POD_47,1,36,Wicket_Break,10:17:51,4,Sprite,Beverage,15
POD_48,1,36,Over_Break,10:20:47,1,CRED,Fintech,45
POD_48,1,36,Over_Break,10:21:32,2,Amazon,Ecommerce,15
POD_49,1,37,Over_Break,10:24:45,1,Mahindra,Auto,30
POD_49,1,37,Over_Break,10:25:15,2,Dove,Personal_Care,30
POD_50,1,38,Over_Break,10:29:13,1,Maruti_Suzuki,Auto,45
POD_50,1,38,Over_Break,10:29:58,2,Kamla_Pasand,FMCG,15
POD_51,1,39,Over_Break,10:32:46,1,Unacademy,EdTech,15
POD_51,1,39,Over_Break,10:33:01,2,Booking_Com,Travel,30
POD_51,1,39,Over_Break,10:33:31,3,Vi,Telecom,15
POD_52,1,40,Wicket_Break,10:35:31,1,Hyundai,Auto,30
POD_52,1,40,Wicket_Break,10:36:01,2,Airtel,Telecom,30
POD_52,1,40,Wicket_Break,10:36:31,3,Flipkart,Ecommerce,30
POD_53,1,40,Over_Break,10:38:45,1,Sprite,Beverage,15
POD_53,1,40,Over_Break,10:39:00,2,Asian_Paints,Home_Decor,45
POD_54,1,41,Over_Break,10:42:52,1,Kamla_Pasand,FMCG,30
POD_54,1,41,Over_Break,10:43:22,2,Coca-Cola,Beverage,30
POD_55,1,42,Wicket_Break,10:46:24,1,Boat,Electronics,30
POD_55,1,42,Wicket_Break,10:46:54,2,Surf_Excel,FMCG,30
POD_55,1,42,Wicket_Break,10:47:24,3,Booking_Com,Travel,30
POD_56,1,42,Half_Time_Break_Part1,10:52:54,1,PhysicsWallah,EdTech,15
POD_56,1,42,Half_Time_Break_Part1,10:53:09,2,Dove,Personal_Care,30
POD_56,1,42,Half_Time_Break_Part1,10:53:39,3,ACKO,Insurance,15
POD_56,1,42,Half_Time_Break_Part1,10:53:54,4,Myntra,Ecommerce,15
POD_56,1,42,Half_Time_Break_Part1,10:54:09,5,Maruti_Suzuki,Auto,30
POD_56,1,42,Half_Time_Break_Part1,10:54:39,6,Hotstar_LiveStream_Promo,Channel_Promo,30
POD_56,1,42,Half_Time_Break_Part1,10:55:09,7,CRED,Fintech,30
POD_56,1,42,Half_Time_Break_Part1,10:55:39,8,Vimal,FMCG,30
POD_56,1,42,Half_Time_Break_Part1,10:56:09,9,Vivo,Electronics,30
POD_56,1,42,Half_Time_Break_Part1,10:56:39,10,Apollo_Tyres,Tyres,30
POD_56,1,42,Half_Time_Break_Part1,10:57:09,11,Pepsi,Beverage,15
POD_56,1,42,Half_Time_Break_Part1,10:57:24,12,Cadbury,Dairy_Food,30
POD_57,1,42,Half_Time_Break_Part2,10:57:54,1,Sprite,Beverage,15
POD_57,1,42,Half_Time_Break_Part2,10:58:09,2,Nivea,Personal_Care,15
POD_57,1,42,Half_Time_Break_Part2,10:58:24,3,PhonePe,Fintech,15
POD_57,1,42,Half_Time_Break_Part2,10:58:39,4,Zomato,Food_Delivery,30
POD_57,1,42,Half_Time_Break_Part2,10:59:09,5,Hotstar_LiveStream_Promo,Channel_Promo,15
POD_57,1,42,Half_Time_Break_Part2,10:59:24,6,Hyundai,Auto,30
POD_57,1,42,Half_Time_Break_Part2,10:59:54,7,MakeMyTrip,Travel,15
POD_57,1,42,Half_Time_Break_Part2,11:00:09,8,Jio,Telecom,15
POD_57,1,42,Half_Time_Break_Part2,11:00:24,9,Ambuja_Cement,Construction,30
POD_57,1,42,Half_Time_Break_Part2,11:00:54,10,Asian_Paints,Home_Decor,45
POD_57,1,42,Half_Time_Break_Part2,11:01:39,11,Britannia,Dairy_Food,15
POD_57,1,42,Half_Time_Break_Part2,11:01:54,12,Unacademy,EdTech,15
POD_57,1,42,Half_Time_Break_Part2,11:02:09,13,Kamla_Pasand,FMCG,30
POD_57,1,42,Half_Time_Break_Part2,11:02:39,14,Amazon,Ecommerce,15
POD_58,1,42,Half_Time_Break_Part3,11:02:54,1,StarSports_MatchPromo,Channel_Promo,15
POD_58,1,42,Half_Time_Break_Part3,11:03:09,2,Berger_Paints,Home_Decor,30
POD_58,1,42,Half_Time_Break_Part3,11:03:39,3,LIC,Insurance,30
POD_58,1,42,Half_Time_Break_Part3,11:04:09,4,MPL,Gaming,15
POD_58,1,42,Half_Time_Break_Part3,11:04:24,5,Swiggy,Food_Delivery,30
POD_58,1,42,Half_Time_Break_Part3,11:04:54,6,Boat,Electronics,15
POD_58,1,42,Half_Time_Break_Part3,11:05:09,7,CEAT_Tyres,Tyres,30
POD_58,1,42,Half_Time_Break_Part3,11:05:39,8,Flipkart,Ecommerce,30
POD_58,1,42,Half_Time_Break_Part3,11:06:09,9,Thums_Up,Beverage,30
POD_58,1,42,Half_Time_Break_Part3,11:06:39,10,Paytm,Fintech,30
POD_58,1,42,Half_Time_Break_Part3,11:07:09,11,Vi,Telecom,30
POD_58,1,42,Half_Time_Break_Part3,11:07:39,12,Booking_Com,Travel,15
POD_59,1,42,Half_Time_Break_Part4,11:07:54,1,PolicyBazaar,Insurance,30
POD_59,1,42,Half_Time_Break_Part4,11:08:24,2,MRF_Tyres,Tyres,30
POD_59,1,42,Half_Time_Break_Part4,11:08:54,3,Vivo,Electronics,15
POD_59,1,42,Half_Time_Break_Part4,11:09:09,4,Dove,Personal_Care,15
POD_59,1,42,Half_Time_Break_Part4,11:09:24,5,RuPay,Fintech,30
POD_59,1,42,Half_Time_Break_Part4,11:09:54,6,PhysicsWallah,EdTech,30
POD_59,1,42,Half_Time_Break_Part4,11:10:24,7,Pepsi,Beverage,15
POD_59,1,42,Half_Time_Break_Part4,11:10:39,8,My11Circle,Gaming,30
POD_59,1,42,Half_Time_Break_Part4,11:11:09,9,Vimal,FMCG,15
POD_59,1,42,Half_Time_Break_Part4,11:11:24,10,Amul,Dairy_Food,15
POD_59,1,42,Half_Time_Break_Part4,11:11:39,11,UltraTech_Cement,Construction,30
POD_59,1,42,Half_Time_Break_Part4,11:12:09,12,Maruti_Suzuki,Auto,45
POD_60,2,1,Over_Break,11:21:04,1,Oppo,Electronics,30
POD_60,2,1,Over_Break,11:21:34,2,Nivea,Personal_Care,30
POD_61,2,2,Over_Break,11:24:41,1,Jio,Telecom,30
POD_61,2,2,Over_Break,11:25:11,2,Booking_Com,Travel,30
POD_62,2,3,Over_Break,11:28:17,1,LIC,Insurance,45
POD_62,2,3,Over_Break,11:29:02,2,Zomato,Food_Delivery,15
POD_63,2,4,Over_Break,11:32:38,1,Hyundai,Auto,30
POD_63,2,4,Over_Break,11:33:08,2,Broadcaster_Highlight_Bumper,Channel_Promo,15
POD_63,2,4,Over_Break,11:33:23,3,Myntra,Ecommerce,15
POD_64,2,5,Wicket_Break,11:35:05,1,UltraTech_Cement,Construction,30
POD_64,2,5,Wicket_Break,11:35:35,2,Apollo_Tyres,Tyres,30
POD_64,2,5,Wicket_Break,11:36:05,3,Thums_Up,Beverage,30
POD_65,2,5,Over_Break,11:38:02,1,Boat,Electronics,15
POD_65,2,5,Over_Break,11:38:17,2,Flipkart,Ecommerce,15
POD_65,2,5,Over_Break,11:38:32,3,CRED,Fintech,30
POD_66,2,6,Over_Break,11:41:56,1,PhonePe,Fintech,30
POD_66,2,6,Over_Break,11:42:26,2,Hyundai,Auto,30
POD_67,2,7,Over_Break,11:45:43,1,Pepsi,Beverage,15
POD_67,2,7,Over_Break,11:45:58,2,Dream11,Gaming,30
POD_67,2,7,Over_Break,11:46:28,3,Jio,Telecom,15
POD_68,2,8,Over_Break,11:49:29,1,CEAT_Tyres,Tyres,30
POD_68,2,8,Over_Break,11:49:59,2,RuPay,Fintech,30
POD_69,2,9,Over_Break,11:53:49,1,Unacademy,EdTech,15
POD_69,2,9,Over_Break,11:54:04,2,MRF_Tyres,Tyres,15
POD_69,2,9,Over_Break,11:54:19,3,Britannia,Dairy_Food,30
POD_70,2,10,Over_Break,11:57:31,1,ACKO,Insurance,30
POD_70,2,10,Over_Break,11:58:01,2,Thums_Up,Beverage,30
POD_71,2,11,Over_Break,12:02:00,1,Amul,Dairy_Food,15
POD_71,2,11,Over_Break,12:02:15,2,Dove,Personal_Care,30
POD_71,2,11,Over_Break,12:02:45,3,MakeMyTrip,Travel,15
POD_72,2,12,Over_Break,12:06:17,1,Boat,Electronics,30
POD_72,2,12,Over_Break,12:06:47,2,Apollo_Tyres,Tyres,30
POD_73,2,13,Over_Break,12:10:45,1,Swiggy,Food_Delivery,15
POD_73,2,13,Over_Break,12:11:00,2,Myntra,Ecommerce,30
POD_73,2,13,Over_Break,12:11:30,3,CEAT_Tyres,Tyres,15
POD_74,2,14,Over_Break,12:14:53,1,Dove,Personal_Care,15
POD_74,2,14,Over_Break,12:15:08,2,Unacademy,EdTech,30
POD_74,2,14,Over_Break,12:15:38,3,Broadcaster_Highlight_Bumper,Channel_Promo,15
POD_75,2,15,Over_Break,12:18:34,1,Tata_Motors,Auto,45
POD_75,2,15,Over_Break,12:19:19,2,MRF_Tyres,Tyres,15
POD_76,2,16,Wicket_Break,12:21:07,1,Surf_Excel,FMCG,30
POD_76,2,16,Wicket_Break,12:21:37,2,Hotstar_LiveStream_Promo,Channel_Promo,15
POD_76,2,16,Wicket_Break,12:21:52,3,Mahindra,Auto,30
POD_76,2,16,Wicket_Break,12:22:22,4,Amul,Dairy_Food,15
POD_77,2,16,Over_Break,12:24:11,1,StarSports_MatchPromo,Channel_Promo,30
POD_77,2,16,Over_Break,12:24:41,2,Oppo,Electronics,30
POD_78,2,17,Over_Break,12:28:09,1,Apollo_Tyres,Tyres,15
POD_78,2,17,Over_Break,12:28:24,2,Asian_Paints,Home_Decor,45
POD_79,2,18,Over_Break,12:31:44,1,LIC,Insurance,45
POD_79,2,18,Over_Break,12:32:29,2,Vimal,FMCG,15
POD_80,2,19,Over_Break,12:35:16,1,PhonePe,Fintech,15
POD_80,2,19,Over_Break,12:35:31,2,Tata_Motors,Auto,45
POD_81,2,20,Over_Break,12:38:58,1,Broadcaster_Highlight_Bumper,Channel_Promo,15
POD_81,2,20,Over_Break,12:39:13,2,Unacademy,EdTech,15
POD_81,2,20,Over_Break,12:39:28,3,Vivo,Electronics,30
POD_82,2,21,Wicket_Break,12:41:19,1,CEAT_Tyres,Tyres,30
POD_82,2,21,Wicket_Break,12:41:49,2,ACKO,Insurance,15
POD_82,2,21,Wicket_Break,12:42:04,3,Dream11,Gaming,30
POD_82,2,21,Wicket_Break,12:42:34,4,Boat,Electronics,15
POD_83,2,21,Over_Break,12:44:11,1,Asian_Paints,Home_Decor,30
POD_83,2,21,Over_Break,12:44:41,2,Cadbury,Dairy_Food,30
POD_84,2,22,Over_Break,12:47:56,1,PolicyBazaar,Insurance,30
POD_84,2,22,Over_Break,12:48:26,2,MPL,Gaming,30
POD_85,2,23,Over_Break,12:52:05,1,Samsung,Electronics,45
POD_85,2,23,Over_Break,12:52:50,2,Swiggy,Food_Delivery,15
POD_86,2,24,Over_Break,12:56:18,1,Maruti_Suzuki,Auto,45
POD_86,2,24,Over_Break,12:57:03,2,Kamla_Pasand,FMCG,15
POD_87,2,25,Strategic_Timeout,12:57:18,1,PhonePe,Fintech,30
POD_87,2,25,Strategic_Timeout,12:57:48,2,Dove,Personal_Care,30
POD_87,2,25,Strategic_Timeout,12:58:18,3,LIC,Insurance,30
POD_87,2,25,Strategic_Timeout,12:58:48,4,Mahindra,Auto,30
POD_87,2,25,Strategic_Timeout,12:59:18,5,Asian_Paints,Home_Decor,45
POD_87,2,25,Strategic_Timeout,13:00:03,6,Vivo,Electronics,15
POD_87,2,25,Strategic_Timeout,13:00:18,7,Surf_Excel,FMCG,30
POD_87,2,25,Strategic_Timeout,13:00:48,8,Britannia,Dairy_Food,30
POD_87,2,25,Strategic_Timeout,13:01:18,9,Coca-Cola,Beverage,30
POD_87,2,25,Strategic_Timeout,13:01:48,10,MRF_Tyres,Tyres,30
POD_88,2,25,Over_Break,13:05:00,1,Tata_Motors,Auto,45
POD_88,2,25,Over_Break,13:05:45,2,Airtel,Telecom,15
POD_89,2,26,Over_Break,13:09:12,1,Zomato,Food_Delivery,15
POD_89,2,26,Over_Break,13:09:27,2,MPL,Gaming,30
POD_89,2,26,Over_Break,13:09:57,3,Vi,Telecom,15
POD_90,2,27,Over_Break,13:12:54,1,CRED,Fintech,30
POD_90,2,27,Over_Break,13:13:24,2,Amul,Dairy_Food,30
POD_91,2,28,Over_Break,13:17:16,1,Surf_Excel,FMCG,30
POD_91,2,28,Over_Break,13:17:46,2,Dove,Personal_Care,30
POD_92,2,29,Over_Break,13:21:27,1,Coca-Cola,Beverage,30
POD_92,2,29,Over_Break,13:21:57,2,MPL,Gaming,30
POD_93,2,30,Over_Break,13:25:45,1,Dream11,Gaming,30
POD_93,2,30,Over_Break,13:26:15,2,MakeMyTrip,Travel,30
POD_94,2,31,Wicket_Break,13:27:16,1,My11Circle,Gaming,15
POD_94,2,31,Wicket_Break,13:27:31,2,Mahindra,Auto,30
POD_94,2,31,Wicket_Break,13:28:01,3,Britannia,Dairy_Food,30
POD_94,2,31,Wicket_Break,13:28:31,4,Swiggy,Food_Delivery,15
POD_95,2,31,Wicket_Break,13:29:17,1,Amul,Dairy_Food,15
POD_95,2,31,Wicket_Break,13:29:32,2,Thums_Up,Beverage,30
POD_95,2,31,Wicket_Break,13:30:02,3,CRED,Fintech,45
POD_96,2,31,Over_Break,13:32:49,1,Boat,Electronics,30
POD_96,2,31,Over_Break,13:33:19,2,Amazon,Ecommerce,30
POD_97,2,32,Over_Break,13:36:46,1,Paytm,Fintech,15
POD_97,2,32,Over_Break,13:37:01,2,Berger_Paints,Home_Decor,30
POD_97,2,32,Over_Break,13:37:31,3,Vivo,Electronics,15
POD_98,2,33,Over_Break,13:40:37,1,Broadcaster_Highlight_Bumper,Channel_Promo,15
POD_98,2,33,Over_Break,13:40:52,2,Tata_Motors,Auto,45
POD_99,2,34,Over_Break,13:44:39,1,PolicyBazaar,Insurance,30
POD_99,2,34,Over_Break,13:45:09,2,Dove,Personal_Care,30
POD_100,2,35,Over_Break,13:48:52,1,Thums_Up,Beverage,30
POD_100,2,35,Over_Break,13:49:22,2,Vi,Telecom,30
POD_101,2,36,Over_Break,13:52:43,1,Hyundai,Auto,30
POD_101,2,36,Over_Break,13:53:13,2,ACKO,Insurance,30
POD_102,2,37,Over_Break,13:57:08,1,Booking_Com,Travel,30
POD_102,2,37,Over_Break,13:57:38,2,Vivo,Electronics,30
POD_103,2,38,Over_Break,14:01:31,1,PhysicsWallah,EdTech,15
POD_103,2,38,Over_Break,14:01:46,2,StarSports_MatchPromo,Channel_Promo,30
POD_103,2,38,Over_Break,14:02:16,3,Swiggy,Food_Delivery,15
POD_104,2,39,Over_Break,14:05:15,1,My11Circle,Gaming,30
POD_104,2,39,Over_Break,14:05:45,2,CRED,Fintech,30
POD_105,2,40,Wicket_Break,14:08:27,1,Boat,Electronics,15
POD_105,2,40,Wicket_Break,14:08:42,2,CEAT_Tyres,Tyres,15
POD_105,2,40,Wicket_Break,14:08:57,3,Ambuja_Cement,Construction,30
POD_105,2,40,Wicket_Break,14:09:27,4,Cadbury,Dairy_Food,30
POD_106,2,40,Over_Break,14:11:03,1,PhysicsWallah,EdTech,15
POD_106,2,40,Over_Break,14:11:18,2,Dove,Personal_Care,15
POD_106,2,40,Over_Break,14:11:33,3,Surf_Excel,FMCG,30
POD_107,2,41,Strategic_Timeout,14:12:03,1,Pepsi,Beverage,15
POD_107,2,41,Strategic_Timeout,14:12:18,2,Dream11,Gaming,30
POD_107,2,41,Strategic_Timeout,14:12:48,3,Flipkart,Ecommerce,30
POD_107,2,41,Strategic_Timeout,14:13:18,4,Asian_Paints,Home_Decor,45
POD_107,2,41,Strategic_Timeout,14:14:03,5,Booking_Com,Travel,30
POD_107,2,41,Strategic_Timeout,14:14:33,6,Kamla_Pasand,FMCG,15
POD_107,2,41,Strategic_Timeout,14:14:48,7,Swiggy,Food_Delivery,15
POD_107,2,41,Strategic_Timeout,14:15:03,8,Vi,Telecom,15
POD_107,2,41,Strategic_Timeout,14:15:18,9,CRED,Fintech,45
POD_107,2,41,Strategic_Timeout,14:16:03,10,StarSports_MatchPromo,Channel_Promo,15
POD_107,2,41,Strategic_Timeout,14:16:18,11,Unacademy,EdTech,15
POD_107,2,41,Strategic_Timeout,14:16:33,12,PolicyBazaar,Insurance,30
POD_108,2,41,Over_Break,14:20:33,1,UltraTech_Cement,Construction,30
POD_108,2,41,Over_Break,14:21:03,2,Boat,Electronics,30
POD_109,2,42,Wicket_Break,14:23:17,1,Ambuja_Cement,Construction,30
POD_109,2,42,Wicket_Break,14:23:47,2,Paytm,Fintech,15
POD_109,2,42,Wicket_Break,14:24:02,3,Amul,Dairy_Food,30
POD_109,2,42,Wicket_Break,14:24:32,4,CEAT_Tyres,Tyres,15
POD_110,2,42,Over_Break,14:25:43,1,LIC,Insurance,30
POD_110,2,42,Over_Break,14:26:13,2,Broadcaster_Highlight_Bumper,Channel_Promo,15
POD_110,2,42,Over_Break,14:26:28,3,Jio,Telecom,15
POD_111,2,43,Over_Break,14:30:00,1,Oppo,Electronics,30
POD_111,2,43,Over_Break,14:30:30,2,Hyundai,Auto,30
POD_112,2,44,Strategic_Timeout,14:31:00,1,Nivea,Personal_Care,15
POD_112,2,44,Strategic_Timeout,14:31:15,2,UltraTech_Cement,Construction,30
POD_112,2,44,Strategic_Timeout,14:31:45,3,Flipkart,Ecommerce,15
POD_112,2,44,Strategic_Timeout,14:32:00,4,MRF_Tyres,Tyres,15
POD_112,2,44,Strategic_Timeout,14:32:15,5,Airtel,Telecom,15
POD_112,2,44,Strategic_Timeout,14:32:30,6,Swiggy,Food_Delivery,15
POD_112,2,44,Strategic_Timeout,14:32:45,7,CRED,Fintech,30
POD_112,2,44,Strategic_Timeout,14:33:15,8,Surf_Excel,FMCG,30
POD_112,2,44,Strategic_Timeout,14:33:45,9,MPL,Gaming,30
POD_112,2,44,Strategic_Timeout,14:34:15,10,Coca-Cola,Beverage,30
POD_112,2,44,Strategic_Timeout,14:34:45,11,Boat,Electronics,30
POD_112,2,44,Strategic_Timeout,14:35:15,12,ACKO,Insurance,30
POD_112,2,44,Strategic_Timeout,14:35:45,13,Cadbury,Dairy_Food,15
POD_113,2,44,Over_Break,14:39:03,1,PhysicsWallah,EdTech,30
POD_113,2,44,Over_Break,14:39:33,2,Vivo,Electronics,30
POD_114,2,45,Over_Break,14:42:55,1,Hyundai,Auto,45
POD_114,2,45,Over_Break,14:43:40,2,Broadcaster_Highlight_Bumper,Channel_Promo,15
POD_115,2,46,Wicket_Break,14:44:51,1,Airtel,Telecom,30
POD_115,2,46,Wicket_Break,14:45:21,2,UltraTech_Cement,Construction,30
POD_115,2,46,Wicket_Break,14:45:51,3,Oppo,Electronics,30
POD_116,2,46,Over_Break,14:48:12,1,StarSports_MatchPromo,Channel_Promo,30
POD_116,2,46,Over_Break,14:48:42,2,Tata_Motors,Auto,30
POD_117,2,47,Over_Break,14:51:58,1,Booking_Com,Travel,15
POD_117,2,47,Over_Break,14:52:13,2,ACKO,Insurance,30
POD_117,2,47,Over_Break,14:52:43,3,Jio,Telecom,15
POD_118,2,48,Wicket_Break,14:54:40,1,Airtel,Telecom,30
POD_118,2,48,Wicket_Break,14:55:10,2,Sprite,Beverage,30
POD_118,2,48,Wicket_Break,14:55:40,3,UltraTech_Cement,Construction,30
POD_119,2,48,Over_Break,14:56:11,1,MakeMyTrip,Travel,30
POD_119,2,48,Over_Break,14:56:41,2,Coca-Cola,Beverage,30
POD_120,2,49,Strategic_Timeout,14:57:11,1,Broadcaster_Highlight_Bumper,Channel_Promo,15
POD_120,2,49,Strategic_Timeout,14:57:26,2,Tata_Motors,Auto,45
POD_120,2,49,Strategic_Timeout,14:58:11,3,Swiggy,Food_Delivery,30
POD_120,2,49,Strategic_Timeout,14:58:41,4,Asian_Paints,Home_Decor,30
POD_120,2,49,Strategic_Timeout,14:59:11,5,My11Circle,Gaming,15
POD_120,2,49,Strategic_Timeout,14:59:26,6,Vivo,Electronics,30
POD_120,2,49,Strategic_Timeout,14:59:56,7,Britannia,Dairy_Food,15
POD_120,2,49,Strategic_Timeout,15:00:11,8,PolicyBazaar,Insurance,30
POD_120,2,49,Strategic_Timeout,15:00:41,9,CRED,Fintech,30
POD_120,2,49,Strategic_Timeout,15:01:11,10,PhysicsWallah,EdTech,30
POD_120,2,49,Strategic_Timeout,15:01:41,11,Vimal,FMCG,30`;

export interface ParsedCsvRow {
  podId: string;
  innings: 1 | 2;
  overNo: number;
  breakType: BreakType;
  timestamp: string;
  slotNo: number;
  brandName: string;
  category: string;
  durationSec: SpotDuration;
}

export function parseSampleCsv(csvString: string = SAMPLE_DATASET_CSV): ParsedCsvRow[] {
  const lines = csvString.trim().split('\n');
  const rows: ParsedCsvRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 9) continue;
    
    rows.push({
      podId: parts[0].trim(),
      innings: parseInt(parts[1].trim(), 10) as 1 | 2,
      overNo: parseInt(parts[2].trim(), 10),
      breakType: parts[3].trim() as BreakType,
      timestamp: parts[4].trim(),
      slotNo: parseInt(parts[5].trim(), 10),
      brandName: parts[6].trim(),
      category: parts[7].trim(),
      durationSec: parseInt(parts[8].trim(), 10) as SpotDuration
    });
  }
  return rows;
}

export function buildPodsFromCsv(csvString: string = SAMPLE_DATASET_CSV): AdPod[] {
  const rows = parseSampleCsv(csvString);
  const podMap = new Map<string, AdPod>();

  for (const r of rows) {
    if (!podMap.has(r.podId)) {
      let targetDuration = 60;
      if (r.breakType === 'Wicket_Break') targetDuration = 90;
      else if (r.breakType === 'Strategic_Timeout' || r.breakType.startsWith('Half_Time')) targetDuration = 300;

      podMap.set(r.podId, {
        id: r.podId,
        innings: r.innings,
        overNo: r.overNo,
        breakType: r.breakType,
        targetDuration,
        timestamp: r.timestamp,
        isAired: false,
        matchContext: {
          innings: r.innings,
          over: r.overNo,
          ball: 0,
          battingTeam: r.innings === 1 ? 'India' : 'Australia',
          bowlingTeam: r.innings === 1 ? 'Australia' : 'India',
          runs: r.innings === 1 ? Math.min(320, r.overNo * 6 + 12) : Math.min(315, r.overNo * 6 + 8),
          wickets: r.breakType === 'Wicket_Break' ? Math.min(9, Math.floor(r.overNo / 4) + 1) : Math.min(9, Math.floor(r.overNo / 5)),
          lastEvent: r.breakType === 'Wicket_Break' ? 'WICKET! Big dismissal!' : 'End of Over',
          wicketJustFell: r.breakType === 'Wicket_Break',
          favouriteWicketFell: r.breakType === 'Wicket_Break' && (r.overNo === 5 || r.overNo === 17 || r.overNo === 35),
          runRate: 6.2
        },
        slots: []
      });
    }

    const pod = podMap.get(r.podId)!;
    const brand = findBrandByName(r.brandName);
    
    pod.slots.push({
      slotNumber: r.slotNo,
      duration: r.durationSec,
      brand: brand || {
        id: r.brandName.toLowerCase(),
        name: r.brandName.replace(/_/g, ' '),
        category: r.category as any,
        availableDurations: [r.durationSec],
        contract: { allowedInnings: [1, 2], allowedBreakTypes: [r.breakType], targetAirings: 5 },
        tier: 'Bronze',
        rivalBrandIds: [],
        safetyTags: ['family_safe'],
        isSynthetic: true
      }
    });
  }

  return Array.from(podMap.values());
}
