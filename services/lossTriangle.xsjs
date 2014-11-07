var bp = $.request.parameters.get("bp");
var lob = $.request.parameters.get("lob");
var polygon = $.request.parameters.get("polygon");
var predict = $.request.parameters.get("predict");
var sqlstmt, conn, pstmt, rs, obj, i;
var temp = {};
temp.data = [];
var output = {};
output.results = [];

$.response.contentType = "text/json";
$.response.status = $.net.http.OK;

conn = $.db.getConnection();

sqlstmt = 'SET SCHEMA SHA_INSURANCE';
conn.prepareStatement(sqlstmt).execute();

sqlstmt = 'DROP VIEW R_CL_DATA';
try {
    conn.prepareStatement(sqlstmt).execute();
} catch (e) {}

sqlstmt = 'CREATE VIEW R_CL_DATA AS'
        + ' SELECT "ClaimYear" AS "Year", SUM("InsurClm12MnthPaidLossAmt") AS "D1", SUM("InsurClm24MnthPaidLossAmt") AS "D2", SUM("InsurClm36MnthPaidLossAmt") AS "D3", SUM("InsurClm48MnthPaidLossAmt") AS "D4", SUM("InsurClm60MnthPaidLossAmt") AS "D5"'
		+ '  FROM "_SYS_BIC"."SHA_Insurance/SHA_SOURCE_GEO"'
		+ '  WHERE 1=1';
if (bp !== undefined) {
	sqlstmt += ' AND "BusinessPartner"=\'' + bp.replace(/[^0-9-A-z]/g,"") + '\'';
}
if (lob !== undefined) {
	sqlstmt += ' AND "LineOfBusiness"=\'' + lob.replace(/[^0-9-A-z]/g,"") + '\'';
}
if (polygon !== undefined) {
    sqlstmt += ' AND "LatLong_Point".ST_Within(NEW ST_Polygon(\'Polygon((' + polygon.replace(/[^0-9-., ]/g,"") + '))\'))=1';
}
sqlstmt += ' GROUP BY "ClaimYear"';
conn.prepareStatement(sqlstmt).execute();
sqlstmt = 'SELECT "Year", "D1", "D2", "D3", "D4", "D5" FROM R_CL_DATA';
pstmt = conn.prepareStatement(sqlstmt);
rs = pstmt.executeQuery();
while (rs.next()) {
	obj = {};
    obj.Year = rs.getString(1);
    obj.D1 = Math.round(rs.getDecimal(2));
    if (obj.D1 === 0) {obj.StateD1 = "P"} else {obj.StateD1 = ""}
    obj.D2 = Math.round(rs.getDecimal(3));
    if (obj.D2 === 0) {obj.StateD2 = "P"} else {obj.StateD2 = ""}
    obj.D3 = Math.round(rs.getDecimal(4));
    if (obj.D3 === 0) {obj.StateD3 = "P"} else {obj.StateD3 = ""}
    obj.D4 = Math.round(rs.getDecimal(5));
    if (obj.D4 === 0) {obj.StateD4 = "P"} else {obj.StateD4 = ""}
    obj.D5 = Math.round(rs.getDecimal(6));
    if (obj.D5 === 0) {obj.StateD5 = "P"} else {obj.StateD5 = ""}
    if (predict == 1) {
        temp.data.push(obj);
    } else {
        output.results.push(obj);
    }
}
rs.close();
pstmt.close();
	
if (predict == 1) {
    sqlstmt = 'TRUNCATE TABLE R_CL_RESULTS';
    conn.prepareStatement(sqlstmt).execute();
    sqlstmt = 'CALL R_CL (R_CL_DATA, R_CL_RESULTS) WITH OVERVIEW';
    conn.prepareCall(sqlstmt).execute();
    sqlstmt = 'SELECT "Year", "D1", "D2", "D3", "D4", "D5" FROM R_CL_RESULTS';
    pstmt = conn.prepareStatement(sqlstmt);
    rs = pstmt.executeQuery();
    i = 0;
    while (rs.next()) {
        obj = {};
        obj.Year = rs.getString(1);
        obj.D1 = Math.round(rs.getDecimal(2));
        obj.StateD1 = temp.data[i].StateD1;
        obj.D2 = Math.round(rs.getDecimal(3));
        obj.StateD2 = temp.data[i].StateD2;
        obj.D3 = Math.round(rs.getDecimal(4));
        obj.StateD3 = temp.data[i].StateD3;
        obj.D4 = Math.round(rs.getDecimal(5));
        obj.StateD4 = temp.data[i].StateD4;
        obj.D5 = Math.round(rs.getDecimal(6));
        obj.StateD5 = temp.data[i].StateD5;
        output.results.push(obj);
        i = i + 1;
    }
    rs.close();
    pstmt.close();
}

sqlstmt = ' SELECT SUM("ClaimPaymentAmount")'
        + '  FROM "_SYS_BIC"."SHA_Insurance/SHA_CLAIMS_PAYMENT_GEO"';
if (polygon !== undefined) {
    sqlstmt += ' WHERE "LatLong_Point".ST_Within(NEW ST_Polygon(\'Polygon((' + polygon.replace(/[^0-9-., ]/g,"") + '))\'))=1';
}
pstmt = conn.prepareStatement(sqlstmt);
rs = pstmt.executeQuery();
if (rs.next()) {
    output.claimPaymentAmount = Math.round(rs.getDecimal(1));
}
rs.close();
pstmt.close();

sqlstmt = ' SELECT SUM("PremiumBeforeTax")'
		+ '  FROM "_SYS_BIC"."SHA_Insurance/SHA_CONTRACT_PREMIUM_GEO"';
if (polygon !== undefined) {
    sqlstmt += ' WHERE "LatLong_Point".ST_Within(NEW ST_Polygon(\'Polygon((' + polygon.replace(/[^0-9-., ]/g,"") + '))\'))=1';
}
pstmt = conn.prepareStatement(sqlstmt);
rs = pstmt.executeQuery();
if (rs.next()) {
    output.premiumBeforeTax = Math.round(rs.getDecimal(1));
}
rs.close();
pstmt.close();
	
if (conn) {conn.close();}	

$.response.setBody(JSON.stringify(output));
