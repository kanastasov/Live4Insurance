SET SCHEMA SHA_INSURANCE;

DROP TYPE R_CL_T;
DROP TABLE R_CL_RESULTS;
DROP PROCEDURE R_CL;

CREATE TYPE R_CL_T AS TABLE ("Year" VARCHAR(4), "D1" DECIMAL(18,2), "D2" DECIMAL(18,2), "D3" DECIMAL(18,2), "D4" DECIMAL(18,2), "D5" DECIMAL(18,2));
CREATE COLUMN TABLE R_CL_RESULTS LIKE R_CL_T;

-- R setup
CREATE PROCEDURE R_CL (IN data R_CL_T, OUT results R_CL_T)
LANGUAGE RLANG AS 
BEGIN
	library(reshape)
	library(ChainLadder)
	origin <- colnames(data)[1]
	data[data==0] <- NA
	dfm <- melt(data, id=origin)
	tri <- as.triangle(dfm, origin=origin, dev="variable", value="value")
	cl <- MackChainLadder(tri, est.sigma="Mack")
	results <- cbind(data[origin],cl$FullTriangle[,])
END;

-- app runtime
DROP VIEW R_CL_DATA;
CREATE VIEW R_CL_DATA AS
	SELECT "ClaimYear" AS "Year", SUM("InsurClm12MnthPaidLossAmt") AS "D1", SUM("InsurClm24MnthPaidLossAmt") AS "D2", SUM("InsurClm36MnthPaidLossAmt") AS "D3", SUM("InsurClm48MnthPaidLossAmt") AS "D4", SUM("InsurClm60MnthPaidLossAmt") AS "D5"
	 FROM "_SYS_BIC"."SHA_Insurance/SHA_SOURCE_GEO"
	 GROUP BY "ClaimYear"
	 ;

TRUNCATE TABLE R_CL_RESULTS;

CALL R_CL (R_CL_DATA, R_CL_RESULTS) WITH OVERVIEW;

SELECT * FROM R_CL_DATA;
SELECT * FROM R_CL_RESULTS;
