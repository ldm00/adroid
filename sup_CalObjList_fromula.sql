/**
 查看 obj_real_time_elc_procedure 存储过程是否存在，如果存在就删掉
**/
IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = object_id(N'[dbo].sup_CalObjList_fromula') and OBJECTPROPERTY(id, N'IsProcedure') = 1)
   DROP PROCEDURE  dbo.sup_CalObjList_fromula
GO

/**
创建sup_CalObjList_fromula存储过程 
--年
-- exec sup_CalObjList_fromula 'Y','210001H001:V001 * 0.7 + V016&210001H002:V002 * 0.7 + V012','2015' 
--月
--exec sup_CalObjList_fromula 'M','210001H001:V001 * 0.7 + V016&210001H002:V002 * 0.7 + V012','2015-12' 
--天
--exec sup_CalObjList_fromula 'D','210001H001:V001 * 0.7 + V016&210001H002:V002 * 0.7 + V012','2015-12-19' 
--时
--exec sup_CalObjList_fromula 'H','210001H001:V001 * 0.7 + V016&210001H002:V002 * 0.7 + V012','2015-12-17 02' 
--exec sup_CalObjList_fromula 'H','210001H001:V001 * 0.7 + V016&210001H002:V002 * 0.7 + V012','2015-12-17 13' 
**/
create procedure dbo.sup_CalObjList_fromula(
	   @as_type NVARCHAR(1), --查询类别 Y:年 M:月 D：日 H:小时
	   @as_sql nvarchar(4000),--@as_sql是传进来的字符串,字符串格式为 对象1:公式1&对象2:公式1 
	   @as_date nvarchar(20)) --时间格式为 yyyy/yyyy-mm/yyyy-mm-dd/yyyy-mm-dd hh
as
begin  
	declare 
	@ls_obj_formula nvarchar(1000), --对象和公式 
	@ls_sql nvarchar(4000), --执行sql的变量 
	@ls_obj_code nvarchar(128),  --对象 
	@ls_formula nvarchar(300), -- 公式
	
	@lt_temp_time_id nvarchar(20),-- 变量表里面的 时间值
	@lt_temp_obj_code nvarchar(128),--变量表里面的 对象值
	@lt_temp_cal_result float,  --变量表里面的 公式值
	
	@li_colonChar_index int ,--冒号：表示对象与公式之间
	@li_andChar_index int;--分隔符&表示 对象与对象之间的符号 

  
	declare @lt_temp table (
		    time_id nvarchar(20),  
			obj_code nvarchar(128),  
			cal_result float      
		 );--定义一个表变量，这个变量是保存符合条件的小时历史表里面的数据 
		 
	set @as_sql = replace(@as_sql,' ','');  --传进来的字符串格式为 对象1:公式1&对象2:公式1 
	set @li_colonChar_index = charindex(':',@as_sql);--分隔符:表示 对象与公式之间的符号 
	set @li_andChar_index = charindex('&',@as_sql);-- 分隔符&表示 对象与对象之间的符号  
	 
	while @li_andChar_index >=0
	begin
	    if(charindex('&',@as_sql) <> 0)
			set @ls_obj_formula = substring(@as_sql,1,@li_andChar_index-1);
		else
		    set @ls_obj_formula = @as_sql;
		 --获取第一个对象的能耗数据  格式为 对象1:公式1
	    set @ls_obj_code = substring(@ls_obj_formula,1,@li_colonChar_index-1);--获得对象 
	    set @ls_formula = substring(@ls_obj_formula,1+@li_colonChar_index,len(@ls_obj_formula)-@li_colonChar_index) ;--获得公式 
	    if (@as_type = 'H') --小时  yyyy-mm-dd hh
			begin
				set @ls_sql = N' 
				 select @lt_temp_time_id = left(convert(varchar(100), timeId, 24), 2),
					    @lt_temp_obj_code = ''' + @ls_obj_code + ''',
					    @lt_temp_cal_result =  cast ('+@ls_formula+' as float) 
			     from Sample_h1_000 where  convert(varchar(13), timeid, 20) = '''+@as_date+''''; 
			end
		else if (@as_type = 'D')--日 yyyy-mm-dd		
			begin
			set @ls_sql = N'
					 select @lt_temp_time_id = convert(varchar(100),timeid, 23),
						    @lt_temp_obj_code = ''' + @ls_obj_code + ''' ,
						    @lt_temp_cal_result =  cast ('+@ls_formula+' as float)   
				     from Sample_day_000 where timeId =  '''+@as_date+ ''''; 
				end
		else if (@as_type = 'M')--月 yyyy-mm
			begin
				set @ls_sql = N'
					 select @lt_temp_time_id = left(convert(varchar(100),timeid, 23),7),
						    @lt_temp_obj_code = cast(''' + @ls_obj_code + ''' as nvarchar),
						    @lt_temp_cal_result = sum(cast ('+@ls_formula+' as float))  
				     from Sample_day_000 
				     where timeId >= left( convert(varchar(100), '''+@as_date+ ''', 23) ,7)+''-01'' 
						   and timeId < dateadd(month, 1, left( convert(varchar(100), '''+@as_date+ ''', 23) ,7)+''-01'') 
				     group by  left(convert(varchar(100),timeid, 23),7)';
			end  
		else if (@as_type = 'Y')--年返回时间的格式为 yyyy 时间参数的格式为 yyyy 比如：2015
			begin
			set @ls_sql = N'
					select @lt_temp_time_id = datePart(year,timeid),
						   @lt_temp_obj_code = cast(''' + @ls_obj_code  + ''' as nvarchar),
						   @lt_temp_cal_result =  sum(cast ('+@ls_formula+' as float))  
				   from Sample_day_000 
				   where timeId between ''' + @as_date + ''' and dateadd(year, 1, ''' + @as_date + ''') 
				   group by datePart(year,timeid)';
			end    
		 exec sp_executesql 
			  @stmt=@ls_sql,  
			  @params=N'  @lt_temp_time_id nvarchar(20) output, 
					  	  @lt_temp_obj_code nvarchar(128) output, 
						  @lt_temp_cal_result float output',
			  @lt_temp_time_id=@lt_temp_time_id output,
			  @lt_temp_obj_code=@lt_temp_obj_code output,
			  @lt_temp_cal_result=@lt_temp_cal_result output ; 
		if (@as_type = 'H') --小时  yyyy-mm-dd hh
			begin
				insert into @lt_temp(time_id,obj_code,cal_result) 
				values(isnull(@lt_temp_time_id,right(''+@as_date+'',2)),
				       isnull(@lt_temp_obj_code, ''+@ls_obj_code+''),
				       round(isnull(@lt_temp_cal_result,0),3));
			end	  
		else 
		begin
			insert into @lt_temp(time_id,obj_code,cal_result) 
			values  (isnull(@lt_temp_time_id,''+@as_date+''),
			         isnull(@lt_temp_obj_code, ''+@ls_obj_code+''),
			         round(isnull(@lt_temp_cal_result,0),3));
		end
		if(@li_andChar_index = 0)
		    break;
		
		set @as_sql = substring(@as_sql,@li_andChar_index+1,len(@as_sql)-@li_andChar_index); 
		Set @li_colonChar_index = charindex(':',@as_sql); 
		Set @li_andChar_index = charindex('&',@as_sql); 
	end  
	
	select * from @lt_temp;   
end  
go
 