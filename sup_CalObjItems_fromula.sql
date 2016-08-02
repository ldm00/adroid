IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = object_id(N'[dbo].[sup_CalObjItems_fromula]') and OBJECTPROPERTY(id, N'IsProcedure') = 1)
   DROP PROCEDURE [dbo].sup_CalObjItems_fromula
GO
--exec sup_CalObjItems_fromula N'U001:V001&U002:V002',N'U002:V003',N'U002:V004',N'U003:V006',N'Y',N'2012'
--exec sup_CalObjItems_fromula N'U001:V001&U002:V002',N'U002:V003',N'U002:V004',N'U003:V006',N'M',N'2012-02'
--exec sup_CalObjItems_fromula N'U001:V001&U002:V002',N'U002:V003',N'U002:V004',N'U003:V006',N'D',N'2012-02-17'
--exec sup_CalObjItems_fromula N'U001:V001&U002:V002',N'U002:V003',N'U002:V004',N'U003:V006',N'H',N'2012-03-01 03'
CREATE PROCEDURE [dbo].sup_CalObjItems_fromula
	@as_formula_01  NVARCHAR(4000), --能耗分项01,02,03,04 / 01A,01B,01C,01D
	@as_formula_02  NVARCHAR(4000),
	@as_formula_03  NVARCHAR(4000),
	@as_formula_04  NVARCHAR(4000),
	@as_type NVARCHAR(1), --查询类别 Y:年 M:月 D:日 H:小时
	@as_date NVARCHAR(20)
AS
BEGIN 
--能耗分项
SET NOCOUNT ON
CREATE TABLE #lt_temp01(
	time_id nvarchar(20),
	obj_code nvarchar(128),
	formula_val float
);
CREATE TABLE #lt_temp02(
	time_id nvarchar(20),
	obj_code nvarchar(128),
	formula_val float
);
CREATE TABLE #lt_temp03(
	time_id nvarchar(20),
	obj_code nvarchar(128),
	formula_val float
);
CREATE TABLE #lt_temp04(
	time_id nvarchar(20),
	obj_code nvarchar(128),
	formula_val float
);

INSERT INTO #lt_temp01 EXEC sup_CalObjList_fromula @as_type, @as_formula_01, @as_date;
INSERT INTO #lt_temp02 EXEC sup_CalObjList_fromula @as_type, @as_formula_02, @as_date;
INSERT INTO #lt_temp03 EXEC sup_CalObjList_fromula @as_type, @as_formula_03, @as_date;
INSERT INTO #lt_temp04 EXEC sup_CalObjList_fromula @as_type, @as_formula_04, @as_date;

SELECT CASE WHEN t1.obj_code IS NOT NULL THEN t1.obj_code
			WHEN t2.obj_code IS NOT NULL THEN t2.obj_code
			WHEN t3.obj_code IS NOT NULL THEN t3.obj_code
			WHEN t4.obj_code IS NOT NULL THEN t4.obj_code END AS obj_code,
	   CASE WHEN t1.time_id IS NOT NULL THEN t1.time_id
			WHEN t2.time_id IS NOT NULL THEN t2.time_id
			WHEN t3.time_id IS NOT NULL THEN t3.time_id
			WHEN t4.time_id IS NOT NULL THEN t4.time_id END AS time_id,
	   isnull(t1.formula_val,0) formula01_val, isnull(t2.formula_val,0) formula02_val, isnull(t3.formula_val,0) formula03_val, isnull(t4.formula_val,0) formula04_val
FROM #lt_temp01 t1
FULL join #lt_temp02 t2 ON t1.obj_code = t2.obj_code
FULL join #lt_temp03 t3 ON t1.obj_code = t3.obj_code
FULL join #lt_temp04 t4 ON t1.obj_code = t4.obj_code;

END
GO