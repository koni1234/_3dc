(function( $ ){
    $.fn._3dc=function(settings , arg ){ 
        //oggetto carousel dom
        var _this = this ,
            w = $(window),
            d = $(document),
            carousel = $(this), 
            carouselWidth = carousel.width(),
            panelCount = carousel.children().length,
            container = carousel.parent(),
            progressBar = null ;
        
        //variabili runtime
        var status = {
            internetExplorer: null ,
            touchSupport : ('ontouchstart' in document.documentElement),
            onFakeSwipe : false , 
            checkFakeSwipe : null ,
            onTouch : false ,
            touched : false ,
            touchPoint : null,
            onDrag : false ,
            onDragEnd : false , //usato x determinare momento in cui cambio slide ( x ottimizzare tocchi ripetuti )
            dragged : false ,
            checkDrag : null,
            checkDragEnd : null,
            dragPoint : null,
            dragSpeed : null,
            dragSpeedDistance : null,
            dragSpeedTime : null,
            checkDragSpeed : null,
            tempTimestamp : null,
            tempPoint: null,
            tempDirection : null,//indica direzione eventi drag/mousewheel e tutti i change slide
            tempTheta:null,
            lastTheta : null,
            theta : 0,
            r : Math.round( ( carouselWidth / 2 ) / Math.tan( Math.PI / panelCount ) ),
            activePanel : null ,
            tempPanel : null ,
            timerStatus : null, //on - off - pause
            checkTimer : null, 
            checkTimerStopped : null,
            pointerStatus: null  //in out - usato x vedere quando posso attivare timer onmouseenter onmouseleave
        };
        
        //methods    
        _this.lock = function() {
            carousel.addClass('locked'); 
        }, 
        _this.unlock = function() {
            carousel.removeClass('locked'); 
        },
        _this.setTranslateZ = function() { 
            carouselWidth = carousel.width();
            status.r = Math.round( ( carouselWidth / 2 ) / Math.tan( Math.PI / panelCount ) );
            
            if(carousel.hasClass('locked')) return; 
            //NB: se faccio resize con locked ci saranno bug grafici
            
            //setto e aggiorno valori translateZ dinamici
            if(status.internetExplorer === true) {
                //carousel.css('transform','translateZ( -'+status.r+'px )'); 
                $.each(carousel.children(),function(){  
                    $(this).css('transform','translateZ( -'+status.r+'px ) rotateY(' + (( 360 / panelCount )/* * $(this).index()*/) + 'deg) translateZ( '+status.r+'px )');// scale(0.8)
                });
            }
            else {
                carousel.css('transform','translateZ( -'+status.r+'px )'); 
                $.each(carousel.children(),function(){  
                    $(this).css('transform','rotateY(' + (( 360 / panelCount ) * $(this).index()) + 'deg) translateZ( '+status.r+'px ) scale(0.8)');
                });
            }
            status.activePanel = 1 ;
            status.theta = 0 ;
            status.tempDirection = null ; 
            //imposto classe active su slide in primo piano
            carousel.children('.active').removeClass('active');
            carousel.children().eq(status.activePanel -1).addClass('active'); 
            if(status.internetExplorer === true) {
                carousel.children().eq(status.activePanel -1).css(
                    'transform','translateZ( -'+status.r+'px ) rotateY(' + (( 360 / panelCount ) * carousel.children().eq(status.activePanel -1).index()) + 'deg) '+
                    'translateZ( '+status.r+'px )'// scale(1) 
                );
            }
            else {
                carousel.children().eq(status.activePanel -1).css(
                    'transform','rotateY(' + (( 360 / panelCount ) * carousel.children().eq(status.activePanel -1).index()) + 'deg) '+
                    'translateZ( '+status.r+'px ) scale(1)' 
                );
            }
        },
        _this.stopTimer = function(e) { 
            if(e && e.type == 'mouseenter') {
                status.pointerStatus = 'in' ;
            }
            else if (e && e.type == 'mouseleave') {
                status.pointerStatus = 'out' ;
            }
            if(status.timerStatus =='on' || carousel.hasClass('locked')) {
                status.timerStatus = 'off';
                if(options.showTimerPanel === true ) progressBar.stop();
                if(options.debug===true) console.log('stop timer');
            }
            clearTimeout(status.checkTimerStopped); 
            clearInterval(status.checkTimer);   
            //set timeout x verificare quando ripartire
            status.checkTimerStopped=setTimeout(function(){
                _this.startTimer();
            },1000);
        },
        _this.startTimer = function() { 
            clearInterval(status.checkTimer);  
            if(status.pointerStatus != 'in' && !carousel.hasClass('locked') ) { 
                if(status.timerStatus !='pause') {
                    status.timerStatus = 'on';  
                    progressBar.animate({width:'100%'},options.timerSpeed,function(){$(this).css({width:'0%'});});
                    if(options.debug===true) console.log('play timer');
                }
                status.checkTimer = setInterval(function(){
                    if(status.timerStatus !='pause') {
                        _this.onNavButtonClick(1);
                        if(options.showTimerPanel === true ) {
                            progressBar.animate({width:'100%'},options.timerSpeed,function(){$(this).css({width:'0%'});});
                        }
                    }
                },options.timerSpeed);
            }
            else {
                _this.stopTimer();
            }
        },
        _this.setTimer = function() {
            if(options.showTimerPanel === true ) {
                //mostro pannello start / pause
                container.prepend("<div class='_3dc-timer'><span class='_3dc-timer-btn pause'></span><span class='_3dc-timer-progress-bar'></span></div>");
                progressBar = container.find('._3dc-timer-progress-bar');
                //setto eventi on click
                container.find('._3dc-timer-btn').on('click',function(){ 
                    if($(this).hasClass('pause')) {    
                        status.timerStatus = 'pause'; 
                        if(options.debug===true) console.log('pause timer'); 
                        $(this).removeClass('pause').addClass('play');
                        progressBar.stop();
                    }
                    else if($(this).hasClass('play')) {    
                        status.timerStatus = 'on'; 
                        if(options.debug===true) console.log('resume timer'); 
                        $(this).removeClass('play').addClass('pause');
                        clearTimeout(status.checkTimerStopped); 
                        _this.startTimer();
                    }
                });
            }
            //attivo timer
            _this.startTimer();
            
            //setto eventi dove stoppare timer
            $("body").keydown(function(e) {
                if(e.keyCode == 37 || e.keyCode == 39) { 
                   _this.stopTimer();
                }
            }); 
            if(status.touchSupport ){ 
                container.on('touchstart',_this.stopTimer).on('mousemove touchmove',_this.stopTimer).on('mouseup touchend',_this.stopTimer);
            }
            else if(navigator.userAgent.match(/(iPod|iPhone|iPad)/)){  
                container.on('touchstart',_this.stopTimer).on('mousemove touchmove',_this.stopTimer).on('mouseup touchend',_this.stopTimer); 
            }
            else {
                container.on('mouseenter',_this.stopTimer).on('mousemove',_this.stopTimer).on('mouseleave',_this.stopTimer);
                container.on('DOMMouseWheel mousewheel DOMMouseScroll',_this.stopTimer);
            }
        },
        _this.setNavigationArrows = function() {
            container.append("<div class='"+options.navArrowsPrevClass+"'></div><div class='"+options.navArrowsNextClass+"'></div>");
            //setto eventi on click
            container.children('.'+options.navArrowsPrevClass).on('click',function(){
                if(  status.onFakeSwipe === false && status.onDrag === false) { // left
                    _this.onNavButtonClick(-1);
                }
            });
            container.children('.'+options.navArrowsNextClass).on('click',function(){
                if(  status.onFakeSwipe === false && status.onDrag === false) { // right
                    _this.onNavButtonClick(1);
                }
            }); 
        },
        _this.notifyCustomEvents = function(type , originalEvent) {
            if(type == 'changeSlide' ) {
                //oltre a notificare l'evento applico le funzioni base .. in questo caso aggiornare la slide in primo piano
               
                if(status.internetExplorer === true) { 
                    //IE non funziona transform-style : preserve-3d !!! ..... non giro carousel ma sposto slides  
                    
                    if (status.tempDirection == 'right') {
                        //muovo nuova active slide 
                        carousel.children().eq(status.activePanel -1).css(
                            'transform','translateZ( -'+status.r+'px ) rotateY(0deg) translateZ( '+status.r+'px ) ' 
                        );
                        //muovo vecchia active slide 
                        carousel.children('.active').css(
                            'transform','translateZ( -'+status.r+'px ) rotateY( -' + (( 360 / panelCount )) + 'deg) translateZ( '+status.r+'px )'
                        );
                        //muovo restanti slide non active x mantenere flusso grafico sequenziale x successivi changeslide in questa direzione
                        $.each(carousel.children(),function(){  
                            //not class active in un modo..active in un altro
                            if($(this).hasClass('active')|| carousel.children().index(this) == (status.activePanel -1) ) { }
                            else { 
                                $(this).css('transform','translateZ( -'+status.r+'px ) rotateY( ' + (( 360 / panelCount )) + 'deg) translateZ( '+status.r+'px )');
                            }
                        }); 
                    }
                    else {
                        //muovo nuova active slide 
                        carousel.children().eq(status.activePanel -1).css(
                            'transform','translateZ( -'+status.r+'px ) rotateY(0deg) translateZ( '+status.r+'px )'
                        );
                        //muovo vecchia active slide 
                        carousel.children('.active').css(
                            'transform','translateZ( -'+status.r+'px ) rotateY( ' + (( 360 / panelCount )) + 'deg) translateZ( '+status.r+'px )'
                        );
                        //muovo restanti slide non active x mantenere flusso grafico sequenziale x successivi changeslide in questa direzione
                        $.each(carousel.children(),function(){  
                            //not class active in un modo..active in un altro
                            if($(this).hasClass('active') || carousel.children().index(this) == (status.activePanel -1) ) { }
                            else {  
                                $(this).css('transform','translateZ( -'+status.r+'px ) rotateY( -' + (( 360 / panelCount )) + 'deg) translateZ( '+status.r+'px )');
                            }
                        });  
                    }
                        
                    carousel.children('.active').removeClass('active');
                    carousel.children().eq(status.activePanel -1).addClass('active'); 
                }
                else { 
                    carousel.children('.active').css(
                        'transform','rotateY(' + (( 360 / panelCount ) * carousel.children('.active').index()) + 'deg) '+
                        'translateZ( '+status.r+'px ) scale(0.8)'
                    );
                    carousel.children('.active').removeClass('active');
                    carousel.children().eq(status.activePanel -1).addClass('active');   
                    carousel.children().eq(status.activePanel -1).css(
                        'transform','rotateY(' + (( 360 / panelCount ) * carousel.children().eq(status.activePanel -1).index()) + 'deg) '+
                        'translateZ( '+status.r+'px ) scale(1)'
                    );
                }
                //trigger evento change slide passando info utili
                carousel.trigger({type:'changeSlide',activePanel:status.activePanel,theta:status.theta,direction:status.tempDirection, event:originalEvent });
            }
        },
        _this.enableDragEnd = function() {
            //attivo ondrag end
            status.onDragEnd = true ; 
            //imposto reset onDragEnd via timeout dopo XXXms
            clearTimeout(status.checkDragEnd); 
            status.checkDragEnd=setTimeout(function(){ 
                status.onDragEnd = false; 
                if(options.debug===true) console.info('OnDragEnd finish ' );
            },300);
        },
        _this.calcDragSpeed = function(e) { 
            var now= Date.now();
            if(e && e.type=='touchstart') {
                status.tempTimestamp = now;
                status.lastTheta = status.tempTheta;
                //setto timer x check tempi morti
                clearTimeout(status.checkDragSpeed); 
                status.checkDragSpeed=setTimeout(_this.calcDragSpeed,options.dragSpeedRefValue);  
            } 
            else if(e && (e.type=='mouseup' || e.type=='touchend')) {
                clearTimeout(status.checkDragSpeed);
                if(status.tempTimestamp !== null && status.tempTheta!==null  && status.lastTheta!==null ) {
                    status.dragSpeed = ((status.tempTheta - status.lastTheta) / (now-status.tempTimestamp)) * 100;
                    status.dragSpeedTime = now-status.tempTimestamp; 
                    //Check dragspeed - aggiusto valore con time a 200ms nel caso sia diverso
                    if( status.dragSpeedTime != options.dragSpeedRefValue && status.dragSpeedTime != 0 ) {
                        status.dragSpeed = status.dragSpeed * ( options.dragSpeedRefValue / status.dragSpeedTime ) ;// * dragSpeedTime
                    }
                    if(options.debug===true) console.info("SPEED = "+status.dragSpeed + " gradi/"+options.dragSpeedRefValue+"ms"); 
                }
                status.tempTimestamp = null;
                status.tempTheta = null;
                status.lastTheta = null; 
            }
            else { 
                status.checkDragSpeed=setTimeout(_this.calcDragSpeed,options.dragSpeedRefValue); 
                if(status.tempTimestamp !== null && status.lastTheta!==null && now != status.tempTimestamp) {                  
                    status.dragSpeed = ((status.tempTheta - status.lastTheta) / (now-status.tempTimestamp)) * 100;
                    status.dragSpeedTime = (now-status.tempTimestamp);
                    status.tempTimestamp = now;
                    status.lastTheta = status.tempTheta; 
                    //Check dragspeed - aggiusto valore con time a 200ms nel caso sia diverso
                    if( status.dragSpeedTime != options.dragSpeedRefValue  && status.dragSpeedTime != 0 ) {
                        status.dragSpeed = status.dragSpeed * ( options.dragSpeedRefValue / status.dragSpeedTime ) ;// * dragSpeedTime
                    }
                    if(options.debug===true) console.info("SPEED = "+status.dragSpeed + " gradi/"+options.dragSpeedRefValue+"ms");  
                }
                else {
                    status.tempTimestamp = now;
                    status.lastTheta = status.tempTheta;
                } 
            }
        },
        _this.onNavButtonClick = function( event ){
            
            if(carousel.hasClass('locked')) return;
            
            var increment = parseInt(event);
            status.theta += ( 360 / panelCount ) * increment * -1; 
            //ricavo deg di disallineamneto e converto valore in %
            var distance = status.theta % ( 360 / panelCount );//deg
            var distanceP = /*Math.abs*/(distance / ( ( 360 / panelCount ) / 100 ));// percentuale 
            //se percentuale è > 50 % o < -50 aggiorno posizione alla slide visivamente corretta 
            if( distanceP > 50 && status.theta > 0 ) { 
                status.theta =  (status.theta - distance) + ( 360 / panelCount );
            }
            else if( distanceP < -50 && status.theta < 0 ) { 
                status.theta =  (status.theta - distance) - ( 360 / panelCount );
            }
            else { 
                status.theta =  (status.theta - distance);
            } 
            if(status.internetExplorer === true) {
                //carousel.css('transform','translateZ( -'+status.r+'px ) rotateY(' + status.theta + 'deg)');
            }
            else {
                carousel.css('transform','translateZ( -'+status.r+'px ) rotateY(' + status.theta + 'deg)');
            }
            //translateZ(0px) rotateY(0deg) scale(1)
            //carousel.css('-ms-transform','rotateY(' + status.theta + 'deg) translateZ( -'+status.r+'px )');
            //check direction
            if(increment > 0 ) status.tempDirection = 'right';
            else if(increment < 0 ) status.tempDirection = 'left';
            //aggiorno indice activePanel
            status.activePanel =  1 + Math.round( Math.abs ( status.theta / ( 360 /panelCount ) ) % panelCount ); 
            if(status.activePanel> panelCount) status.activePanel = 1;
            else if(status.theta > 0 && status.activePanel != 1) status.activePanel = panelCount -status.activePanel + 2; 
            //trigger evento changeSlide  
            _this.notifyCustomEvents('changeSlide',event);
        },
        _this.fakeSwipe = function(e) {
            //sommo eventi e ogni tot ( test 50 x slide ) aziono funzione onNavButtonClick ( countFakeSwipe++)
            if(status.onFakeSwipe === false && !carousel.hasClass('locked') ) {   
                status.onFakeSwipe = carouselWidth ;  
                carousel.css('transition','transform 0s');
                if(options.debug===true) console.log('start swipe '+status.theta);   
            }
            _this.execFakeSwipe(e); 
            clearTimeout(status.checkFakeSwipe); 
            status.checkFakeSwipe=setTimeout(function(){
                
                if(carousel.hasClass('locked')) return;
                //calcolo posizione finale in deg
                //theta = ( 360 / tempPoint ) + theta;   
                //ricavo deg di disallineamneto e converto valore in %
                var distance = status.theta % ( 360 / panelCount );//deg
                var distanceP = /*Math.abs*/(distance / ( ( 360 / panelCount ) / 100 ));// percentuale 
                //se percentuale è > 50 % o < -50 aggiorno posizione alla slide visivamente corretta 
                if( distanceP > 50 && ( status.theta > 0 || status.tempDirection == 'left')) { 
                    status.theta = (status.theta - distance) + ( 360 / panelCount );
                    if(options.debug===true) console.warn('end swipe - align '+distanceP+'% to '+status.theta);
                }
                else if( distanceP < -50 && ( status.theta < 0 || status.tempDirection == 'right')) { 
                    status.theta = (status.theta - distance) - ( 360 / panelCount );
                    if(options.debug===true) console.warn('end swipe - align '+distanceP+'% to '+status.theta);
                }
                else { 
                    status.theta = (status.theta - distance);
                    if(options.debug===true) console.log('end swipe - align '+distanceP+'% ('+distance+') to '+status.theta);
                } 
                
                carousel.css('transition','transform 1s');
                carousel.css('transform','translateZ( -'+status.r+'px ) rotateY(' + status.theta + 'deg)');
                
                //aggiorno indice activePanel
                status.tempPanel =  1+Math.round( Math.abs ( status.theta / ( 360 /panelCount ) ) % panelCount ); 
                if(status.tempPanel> panelCount) status.tempPanel = 1;
                else if(status.theta > 0 && status.tempPanel != 1 ) status.tempPanel = panelCount -status.tempPanel +2;
                if(status.tempPanel != status.activePanel) {
                    //trigger evento changeSlide  
                    status.activePanel = status.tempPanel;
                    _this.notifyCustomEvents('changeSlide',e);
                }
                
                  
                status.onFakeSwipe = false; 
                status.tempPoint=null;
            },125);
        },
        _this.execFakeSwipe = function(e) {
            if(status.onFakeSwipe !== false  && !carousel.hasClass('locked')) {
                if(e.originalEvent.wheelDeltaX != 0 || ( e.type == 'DOMMouseScroll' && e.originalEvent.axis === 1 && e.originalEvent.detail != 0)) { 
                    if( e.type == 'DOMMouseScroll' ) status.tempPoint = e.originalEvent.detail * -3 * panelCount; 
                    else status.tempPoint = e.originalEvent.wheelDeltaX; 
                    //distanza in px ora la converto in % in rapporto a container width 
                    status.tempPoint = ( status.tempPoint * 100 ) / status.onFakeSwipe;
                    //adesso calcolo quante volte ci sta questa distanza in container per arrivare a 100 % di widt
                    status.tempPoint = 100 / status.tempPoint; 
                    status.tempPoint = status.tempPoint * panelCount; // "RALLENTO SWIPE" MOLTIPLICANDO IL VALORE DI TEMP POINT 
                      
                    //check direction
                    if(e.originalEvent.wheelDeltaX > 0 || ( e.type == 'DOMMouseScroll' && e.originalEvent.axis === 1 && e.originalEvent.detail < 0)) status.tempDirection = 'left';
                    else if(e.originalEvent.wheelDeltaX < 0 || ( e.type == 'DOMMouseScroll' && e.originalEvent.axis === 1 && e.originalEvent.detail > 0)) status.tempDirection = 'right';
                    //BUGFIX PREVENT CALCOLI ERRATI - SE MAGGIORE DI 360 Azzero valore
                    //if( Math.abs( 360 / status.tempPoint ) > 360 ) { status.tempPoint = 360; }
                      
                    status.theta = ( 360 / status.tempPoint ) + status.theta; 
                    if(options.debug===true) console.log('on swipe '+status.theta  );
                    carousel.css('transform','translateZ( -'+status.r+'px ) rotateY(' + status.theta + 'deg)');  
            
                    //aggiorno indice activePanel
                    status.tempPanel =  1+Math.round( Math.abs ( status.theta / ( 360 /panelCount ) ) % panelCount ); 
                    if(status.tempPanel> panelCount) status.tempPanel = 1;
                    else if(status.theta > 0 && status.tempPanel != 1 ) status.tempPanel = panelCount -status.tempPanel +2 ;
                    if(status.tempPanel != status.activePanel) {
                        //trigger evento changeSlide  
                        status.activePanel = status.tempPanel;
                        _this.notifyCustomEvents('changeSlide',e);
                    }
                } 
            }
        },
        _this.startDrag = function(e){
            status.onDrag = carouselWidth ; 
            if(e.type=='touchstart') {
                status.dragPoint = e.originalEvent.touches[0].pageX - e.originalEvent.touches[0].target.offsetLeft;
            }
            else { 
                status.dragPoint = e.pageX - e.target.offsetLeft; 
            } 
            status.tempTheta=status.theta;
            _this.calcDragSpeed(e);
            if(options.debug===true) console.log('inizio '+e.type + " " + status.theta);
        },
        _this.execDrag = function(e) {
            if(status.onDrag !== false  && !carousel.hasClass('locked')) {
                if( status.onDragEnd!==true || (status.dragged!==true && e.type!='touchmove')) {
                    carousel.css('transition','transform 0s');
                }
                //mi sposto 
                if(e.type=='touchmove') {
                    status.tempPoint = e.originalEvent.touches[0].pageX - e.originalEvent.touches[0].target.offsetLeft - status.dragPoint ;
                }
                else { 
                    status.tempPoint = e.pageX - e.target.offsetLeft - status.dragPoint ; //distanza px --da cal equivalente in gradi 
                }
                 
                //check direction
                if(status.tempPoint> 0 ) status.tempDirection = 'left';
                else if(status.tempPoint < 0 ) status.tempDirection = 'right'; 
                
                if(status.onDragEnd===true && e.type=='touchmove' &&  (status.tempPoint < -5 || status.tempPoint >5 )) {
                    //Probabilmente sto cercando di forzare giro di slide con ulteriori "swipe" -> non eseguo execDrag ma spetto dragEnd
                    if(options.debug===true) console.info('OnDragEnd continuo - stop '+e.type + " di " + status.tempPoint);
                } 
                else if(status.tempPoint!= 0 ) {  
                    status.checkDrag = status.tempPoint; // salvo temp point da confrontare con evento next ... volendo !
                    
                    if(status.onDragEnd===true && options.debug===true) {
                        //Probabilmente voglio fermarmi e non fare "swipe" continuo -> blocco transition e fisso punto (rotate)
                        carousel.css('transition','transform 0s');
                        if(options.debug===true) console.warn('onDragEnd '+e.type + " " + status.tempPoint); 
                        //reset status onDragEnd (?)
                        clearTimeout(status.checkDragEnd); 
                        status.onDragEnd=false;
                        if(options.debug===true) console.error('OnDragEnd stopped ' + status.tempPoint);
                    } 
                    
                    //distanza in px ora la converto in % in rapporto a container width 
                    status.tempPoint = ( status.tempPoint * 100 ) / status.onDrag;
                    //adesso calcolo quante volte ci sta questa distanza in container per arrivare a 100 % di widt
                    status.tempPoint = 100 / status.tempPoint;
                    
                    //BUGFIX PREVENT CALCOLI ERRATI - SE MAGGIORE DI 360 Azzero valore
                    if( Math.abs(( 360 / status.tempPoint )/ panelCount ) > 360 ) { status.tempPoint = 360; }
                    
                    
                    if(status.internetExplorer === true) {
                        //correggo velocita dividento x 6 (  o panelCount ? ) e qui non sommo a theta
                        status.tempPoint = (( 360 / status.tempPoint )/ panelCount ) /* + status.theta*/; 
  
                        if(options.debug===true) console.log('on '+e.type + " " + status.tempPoint); 
                        status.tempTheta=status.tempPoint; 
                        
                        //muovo next prev e active insieme ... o ci provo
                        carousel.children().eq(status.activePanel -2).css(
                            'transform','translateZ( -'+status.r+'px ) rotateY(' + ((( 360 / panelCount )) + status.tempTheta ) + 'deg) translateZ( '+status.r+'px ) '
                        );
                        carousel.children().eq(status.activePanel -1).css(
                            'transform','translateZ( -'+status.r+'px ) rotateY(' + status.tempTheta + 'deg) translateZ( '+status.r+'px ) '
                        );
                        carousel.children().eq(status.activePanel -0).css(
                            'transform','translateZ( -'+status.r+'px ) rotateY(' + ((( -360 / panelCount )) + status.tempTheta) + 'deg) translateZ( '+status.r+'px ) '
                        );
                    }
                    else { 
                        //correggo velocita dividento x 6 (  o panelCount ? ) e sommo a theta
                        status.tempPoint = (( 360 / status.tempPoint )/ panelCount ) + status.theta;       
                        
                        if(options.debug===true) console.log('on '+e.type + " " + status.tempPoint); 
                        status.tempTheta=status.tempPoint;
                        
                        carousel.css('transform','translateZ( -'+status.r+'px ) rotateY(' + status.tempTheta + 'deg)');
                    }
                    //aggiorno indice activePanel
                    status.tempPanel =  1+Math.round( Math.abs ( status.tempTheta / ( 360 /panelCount ) ) % panelCount ); 
                    if(status.tempPanel> panelCount) status.tempPanel = 1;
                    else if(status.theta > 0 && status.tempPanel != 1 ) status.tempPanel = panelCount -status.tempPanel +2 ;
                    if(status.tempPanel != status.activePanel) {
                        //trigger evento changeSlide  
                        status.activePanel = status.tempPanel;
                        _this.notifyCustomEvents('changeSlide',e);
                    }
                }   
                status.dragged = true;
            }
        },     
        _this.endDrag = function(e) {
            if(status.onDrag !== false && status.dragged === true  && !carousel.hasClass('locked') ) {  
                //calcolo posizione finale in deg  
                status.theta = status.tempTheta;
                status.tempTheta=status.theta;
                
                _this.calcDragSpeed(e);
                
                //ricavo deg di disallineamneto e converto valore in %
                var distance = status.theta % ( 360 / panelCount );//deg
                var distanceP = /*Math.abs*/(distance / ( ( 360 / panelCount ) / 100 ));// percentuale 
                
                //verifico se devo allinearmi a slide piu vicina ( se sono disallineato )
                //se percentuale è > 50 % o < -50 aggiorno posizione alla slide visivamente corretta 
                //Per internet explorer riduco distance
                if(( distanceP > 50 || (status.internetExplorer === true && distanceP > 0) || ( status.onDragEnd === true && distanceP > 0 )) && (status.theta > 0 || status.tempDirection == 'left')){  
                    status.theta = (status.theta - distance) + ( 360 / panelCount );
                    if( e.type=='touchend') { _this.enableDragEnd(); }
                }
                else if((distanceP<-50 || (status.internetExplorer === true && distanceP < 0 ) ||(status.onDragEnd === true && distanceP<0)) && (status.theta < 0 || status.tempDirection == 'right')){  
                    status.theta = (status.theta - distance) - ( 360 / panelCount );
                    if( e.type=='touchend') { _this.enableDragEnd(); }
                }
                else {  
                    status.theta = (status.theta - distance);
                }  
                
                if(options.debug===true) console.log('endDrag on '+e.type + " - "+status.tempDirection+" distance from active " + distanceP); 
                        
                //dragEnd e check speed solo x touch
                if( e.type=='touchend') {
                    //Check dragspeed - aggiusto valore con time a 200ms nel caso sia diverso
                    if( status.dragSpeedTime != options.dragSpeedRefValue  && status.dragSpeedTime != 0 ) { 
                        status.dragSpeed = status.dragSpeed * ( options.dragSpeedRefValue / status.dragSpeedTime ) ; 
                    } 
                    if(options.debug===true) console.info("SPEED = "+status.dragSpeed + " gradi/"+options.dragSpeedRefValue+"ms"); 

                    //ho velocita .. se è ok > di e non 1000000 guardo distanceP e in base a quello aggiungo +1 
                    if( ( status.tempDirection  == 'left' && status.dragSpeed > 66 )) { 
                    //if( ( distanceP > 0 && distanceP < 50 && status.dragSpeed > 66 )) { 
                        //non è distante abbastanza x andare a next ma vado veloce +2 slide
                        status.theta = status.theta + ( 2* (( 360 / panelCount )));
                        if(options.debug===true) console.warn("+2"); 
                    }
                    else if( ( status.tempDirection  == 'left' && status.dragSpeed > 13 )) { 
                    //else if( ( distanceP > 0 && distanceP < 50 && status.dragSpeed > 13 ) || ( distanceP > 50 && status.dragSpeed > 66)) { 
                        //non è distante abbastanza x andare a next ma la accompagno +1 slide
                        //è distante abbastanza x andare a next(+1) e vado veloce +1 slide ( +2 in totale )
                        status.theta = status.theta + (( 360 / panelCount ));
                        if(options.debug===true) console.warn("+1"); 
                    } 
                    else if( ( status.tempDirection  == 'right' && status.dragSpeed < -66 )) { 
                    //else if(( distanceP < 0 && distanceP > -50 && status.dragSpeed < -66 )) { 
                        status.theta = status.theta - ( 2*( 360 / panelCount ) );
                        //non è distante abbastanza x andare a prev ma vado veloce -2 slide
                        if(options.debug===true) console.warn("-1"); 
                    }
                    else if( ( status.tempDirection  == 'right' && status.dragSpeed < -13 )) { 
                    //else if( ( distanceP < 0 && distanceP > -50 && status.dragSpeed < -13 )||( distanceP < -50 && status.dragSpeed < -66 )) { 
                        //non è distante abbastanza x andare a prev ma la accompagno -1 slide
                        //è distante abbastanza x andare a prev(-1) e vado veloce -1 slide ( -2 in totale )
                        status.theta = status.theta - (( 360 / panelCount ));
                        if(options.debug===true) console.warn("-1"); 
                    } 
                }
                
                carousel.css('transition','transform 1s');
                if(status.internetExplorer === true) {
                    //TODO ... ?
                    //carousel.css('transform','translateZ( -'+status.r+'px ) rotateY(' + status.theta + 'deg)'); 
                    //muovo next prev e active insieme ... o ci provo
                    /*carousel.children().eq(status.activePanel -2).css(
                        'transform','translateZ( -'+status.r+'px ) rotateY(' + ((( 360 / panelCount )) + status.theta ) + 'deg) translateZ( '+status.r+'px ) '
                    );
                    carousel.children().eq(status.activePanel -1).css(
                        'transform','translateZ( -'+status.r+'px ) rotateY(' + status.theta + 'deg) translateZ( '+status.r+'px ) '
                    );
                    carousel.children().eq(status.activePanel -0).css(
                        'transform','translateZ( -'+status.r+'px ) rotateY(' + ((( -360 / panelCount )) + status.theta) + 'deg) translateZ( '+status.r+'px ) '
                    );*/
                }
                else {
                    carousel.css('transform','translateZ( -'+status.r+'px ) rotateY(' + status.theta + 'deg)');  
                }
                //aggiorno indice activePanel
                status.tempPanel =  1+Math.round( Math.abs ( status.theta / ( 360 /panelCount ) ) % panelCount ); 
                if(status.tempPanel> panelCount) status.tempPanel = 1;
                else if(status.theta > 0 && status.tempPanel != 1 ) status.tempPanel = panelCount -status.tempPanel +2 ;
                if(status.tempPanel != status.activePanel) {
                    //trigger evento changeSlide  
                    status.activePanel = status.tempPanel;
                    _this.notifyCustomEvents('changeSlide',e);
                }
            }
            else {
                _this.calcDragSpeed(e);
            }
            status.checkDrag = null;
            status.dragPoint = null;
            status.dragged = false ;
            status.onDrag = false ;
        }; 
        
        //eseguo init o metodi chiamati 
        if (settings && typeof(settings) == 'string') {
           if (settings == 'lock') {
               _this.lock();
           }
           else if (settings == 'unlock') {
               _this.unlock();
           }
           return;
        }
        
        //init - opzioni configurabili - settings
        var options = $.extend({
            debug: true,
            height: '100%',
            navArrows: true ,                   //mostro freccie avanti/indietro 
            navArrowsNextClass : '_3dc-next',   //classe css x freccie
            navArrowsPrevClass : '_3dc-prev',   //classe css x freccie
            timer: false,                       //attivo rotazione automatica
            timerSpeed: 5000,                   //tempo di attesa x le rotazioni automatiche
            showTimerPanel : false,             //mostro pannello timer con play/pausa se timer è true 
            onChangeSlide: null                 //callback function x evento onchangeslide
        }, settings);
        // extende di opzioni non configurabili
        options.dragSpeedRefValue = 100;
        
        if (navigator.userAgent && ( navigator.userAgent.indexOf("MSIE ") >= 0 || !!navigator.userAgent.match(/Trident/))) {
            status.internetExplorer = true ;
        }
        
        //init - funzioni ed eventi da ascoltare
        _this.setTranslateZ();  
        
        if(options.navArrows === true ) {
            _this.setNavigationArrows();   
        }
        if(options.timer === true ) {
            _this.setTimer();   
        }
        
        w.on('resize', _this.setTranslateZ ); 
        carousel.on('changeSlide', function(e) {
            if(options.debug===true) console.log(e);
            
            if(options.onChangeSlide && typeof(options.onChangeSlide) == "function") {
                if(options.debug===true) console.info("CALLBACK ONCHANGESLIDE");
                options.onChangeSlide.call(this);
            }
        });
        
        //keypres next prev
        $("body").keydown(function(e) {
            if(e.keyCode == 37 && status.onFakeSwipe === false && status.onDrag === false) { // left
                _this.onNavButtonClick(-1);
            }
            else if(e.keyCode == 39 && status.onFakeSwipe === false && status.onDrag === false) { // right
                _this.onNavButtonClick(1);
            }
        });
        //drag left right distinto x supporto funzione touch x non creare duplicazione di evnti
        if(status.touchSupport ){ 
            container.on('touchstart',_this.startDrag).on('mousemove touchmove',_this.execDrag).on('mouseup touchend',_this.endDrag);
        }
        else if(navigator.userAgent.match(/(iPod|iPhone|iPad)/)){ 
            //con emulatore chrome usare qesta
            container.on('touchstart',_this.startDrag).on('mousemove touchmove',_this.execDrag).on('mouseup touchend',_this.endDrag); 
        }
        else if(status.internetExplorer !== true) {
            container.on('mousedown',_this.startDrag).on('mousemove',_this.execDrag).on('mouseup',_this.endDrag);
            container.on('DOMMouseWheel mousewheel DOMMouseScroll',_this.fakeSwipe);
        } 
     };
})( jQuery );