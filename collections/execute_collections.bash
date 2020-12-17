#!/bin/bash
# 
# Postman collections executor
#
# Released under BSD 3-Clause
# Author: Michele Carignani, ETSI CTI, cti_support@etsi.org
#

usage="\n 
Postman Collection executor for mWT Plugtests(TM)  \n
Usage:                                             \n
     $0 { -h | <envfile> } [<outputfolder>] [test_type]       \n
"

if [ ! `which newman` ] ; then
   echo "newman and the newman-reporter-html are required to execute the collections but could not be found on this machine."
   echo "To install newman visit:" 
   echo "   https://learning.postman.com/docs/postman/collection-runs/command-line-integration-with-newman/"
   echo "If you have NPM, you should just issue: npm install -g newman newman-reporter-html"
   echo "Quitting."
   exit 1
fi

function pause {

	read -n1 -rsp $'Press return to continue, s to skip or anything else to quit...\n' key

	if [ "$key" = '' ]; then
    echo "Excecuting.."
    return 0
	elif [ "$key" = 's'  ] ; then
    echo "Skip."
    return 1
  else
    echo "Quit."
	  exit 0
	fi
}

collections_single=(  
 "TD_POSTMAN_INIT/TD_POSTMAN_INIT.postman_collection.json"  
 "TD_SSD_01/TD_SSD_01.postman_collection.json" 
 "TD_SSD_02/TD_SSD_02.postman_collection.json" 
 "TD_SSD_03/TD_SSD_03.postman_collection.json" 
 "TD_SSP_01/TD_SSP_01.postman_collection.json" 
 "TD_SSP_02/TD_SSP_02.postman_collection.json" 
 "TD_SSP_01_ICOM_LOCAL/TD_SSP_01_ICOM_LOCAL.postman_collection.json" 
 "TD_SSP_01_ICOM_LOCAL/TD_SSP_01_ICOM_LOCAL.postman_collection.json" 
 "TD_SSP_03/TD_SSP_03.postman_collection.json" 
 "TD_SSP_04/TD_SSP_04.postman_collection.json" 
)

collections_lldp=(
 "TD_POSTMAN_INIT/TD_POSTMAN_INIT.postman_collection.json"  
 "TD_LLDP_01/TD_LLDP_01.postman_collection.json"
)

collections_multi=(
 "TD_POSTMAN_INIT/TD_POSTMAN_INIT.postman_collection.json"  
 "TD_MDD_01/TD_MDD_01.postman_collection.json"
 "TD_MDD_02/TD_MDD_02.postman_collection.json"
 "TD_MDD_03/TD_MDD_03.postman_collection.json"
 "TD_MSP_01/TD_MSP_01.postman_collection.json"
 "TD_MSP_01_ICOM_UPDATE/TD_MSP_01_ICOM_UPDATE.postman_collection.json"
 "TD_MSP_02/TD_MSP_02.postman_collection.json"
 "TD_MSP_03/TD_MSP_03.postman_collection.json"
 "TD_MSP_04/TD_MSP_04.postman_collection.json"
)

if [ "$1" = "-h" ] ; then
    echo -e $usage
    exit 0
fi

# Delay between subsequent requests in a Collection (milliseconds)
delay=1000

# Timeout for requests execution (milliseconds)
timeout=120000

gf=glo.json
ef=env.json

custom_env="$1"
outdir="$2"
clc_type="$3"

echo "env: $custom_env, outdir: $outdir, collections: $clc_type"

case $clc_type in
	"lldp") collections=${collections_lldp[@]};;
	"multi") collections=${collections_multi[@]};;
	*) collections=${collections_single[@]};;
esac

for clc in ${collections[@]} ; do
        echo
	echo "--- Next: $clc ---" 
	pause || continue
  if [ "$clc" = "TD_POSTMAN_INIT/TD_POSTMAN_INIT.postman_collection.json" ] ; then
    newman run "$clc" -e "$custom_env" \
		--export-globals $gf --export-environment $ef \
		-r cli,json,html \
    --reporter-json-export "$outdir/$clc.REPORT.json" \
    --reporter-html-export "$outdir/$clc.REPORT.HTML" \
		--working-dir $outdir 
	else
    newman run "$clc" \
		-e $ef -g $gf --export-globals $gf --export-environment $ef \
		--delay-request $delay \
		--timeout-request $timeout \
    -r cli,json,html \
		--reporter-json-export "$outdir/$clc.REPORT.json" \
		--reporter-html-export "$outdir/$clc.REPORT.HTML" \
    --insecure \
    --working-dir $outdir 
  fi
	echo "--- Finished $clc ---"
  echo
done

echo "ALL TESTS EXECUTED. Quit." 
