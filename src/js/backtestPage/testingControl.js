var testingControl = function(){
	this.flags = [];
}

testingControl.prototype.testStrategy = function(getTableFn, testStrategy){
	var self = this;
	var fakeApi = new fakeAPI({btc:0, usd:1000});
	
	var trader = new tradeCore(fakeApi, testStrategy);

	self.addListeners(trader);

	log("Loading trading data...");
	getTableFn(trader.timeFrame, false).then(function(data){
		var tester = new backTester(data, trader);
		var startTotal = fakeApi.fakeBalance.getTotal( data[0].close);
		log("Start backtest trading. Start balance: BTC="+fakeApi.fakeBalance.btc+", USD="+
			fakeApi.fakeBalance.usd+", equal "+startTotal);


		tester.test();
		 
		log("Finish backtesting. End balance: BTC="+fakeApi.fakeBalance.btc+", USD="+fakeApi.fakeBalance.usd+
		", equal "+fakeApi.fakeBalance.getTotal( data[data.length-1].close))	;

		if (fakeApi.fakeBalance.getTotal( data[data.length-1].close) > startTotal){
			webkitNotifications.createNotification(
                  '/img/128.png',
                  'Win!',
                  "Congratulations! Your strategy is good!"
            ).show();			
		}


		chartsUi.makeCharts(data, self.flags, trader.graphs);

	});
}

testingControl.prototype.addListeners = function(trader){
	var self = this;
	var lastTotalBalance = 0;
	var summ = 0;
	var fakeApi = trader.api;

	trader.addBuyListener(function(rate, amount){
		amount *= fakeApi.feeKoef;
		lastTotalBalance =fakeApi.fakeBalance.getTotal(rate);

		log(" bought "+amount+" by "+rate,{
			date: this.lastDate,
			additional: "rate="+rate+", fee=$"+(rate*amount*trader.api.fee).toFixed(4),
		}, "info");

		self.flags.push({
			x: this.lastDate.getTime(),
			title:"B",
		});
	});

	trader.addSellListener(function(rate, amount){
		var win = fakeApi.fakeBalance.getTotal(rate)-lastTotalBalance;
		summ+=win;
		log(" sold "+amount+" by "+rate+". win is $"+win+". total summ = " +summ,{
			date: this.lastDate,
			additional: "total=$"+fakeApi.fakeBalance.getTotal(rate)+", fee=$"+(rate*amount*trader.api.fee).toFixed(4),
		}, win>0 ? "success" : "warning");
		self.flags.push({
			x: this.lastDate.getTime(),
			title:"S",
		});
	});
}