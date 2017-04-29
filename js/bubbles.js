(function( $ ){
    $.fn.bubbles=function(settings , arg ){ 
        //oggetto dom
        var _this = this.get(0),
            container = this,
            rafId = null,
            now = null,
            then = Date.now(),
            delta = null; 
        
        container.info = { position:_this.getBoundingClientRect() };
        
        //init - opzioni configurabili - settings
        var options = $.extend({
            debug: false, 
            onClose: null,
            maxBlubles: 5,
            timeLimit: 30,
            collisions: true,   //todo attivare option
            borders: true,      //todo attivare option
            mode: 1
            /*1 = gioco finisce quando utente distrugge tutte le palline (subito tutte le palline)*/
            /*2 = gioco finisce quando finisce il tempo ( le palline si rigenerano nel tempo - sono infinte - ci sono bonus timer)*/
            /*3 = gioco non finisce mai */
        }, settings);
        
        //opzioni non configurabili
        options.counter= 0, 
        options.timerInterval = 500,
        options.checkTimer = null;
        
        options.background = {};
        options.background.counter= 0,
        options.background.timerInterval = 25000, 
        options.background.fps = 24,
        options.background.frameInterval = 1000 / options.background.fps ; 
        
        //stats game
        var stats = {
            totalStars: 0,
            totalClouds: 0,
            totalSun: 0,
            totalMoon: 0,
            totalBubbles: 0,
            totalBubblesHits: 0,
            totalShots: 0,
            shotRating: 0,
            time: 0,
            timeUp: false
        };
        
        _this.bubbles = [],
        _this.clouds = [],
        _this.stars = [],
        _this.sun = [],
        _this.moon = [],
        _this.bubblesCollisions = [];
        _this.init = function(){
            if( rafId === null) {
                rafId = window.requestAnimFrame = (function(){
                    return  window.requestAnimationFrame || 
                        window.webkitRequestAnimationFrame || 
                        window.mozRequestAnimationFrame || 
                        window.oRequestAnimationFrame || 
                        window.msRequestAnimationFrame || 
                        function(callback, element){
                        window.setTimeout(function(){}, 1000 / 60);
                    };
                })();
            }
            container.addClass("bubblesContainer loading");  
            container.fadeOut(1000,function(){ 
                container.empty(); 
                container.removeClass("loading").addClass("ready"); 
                options.counter= 0;
                stats = {
                    totalBubbles: 0,
                    totalBubblesHits: 0,
                    totalShots: 0,
                    shotRating: 0,
                    time: Date.now()
                };
                container.show(); 
                
                container.on('click',function(){
                    stats.totalShots ++ 
                    stats.shotRating = ( stats.totalBubblesHits / stats.totalShots ) * 100 ;
                    _this.dispatchEvent(new CustomEvent("shot", { "detail": stats })); 
                });
                
                _this.showMainMenu(); 
                _this.animateFrame();
                 
                _this.addEventListener('hit',_this.updateStatsPanel, false);
                _this.addEventListener('hit',_this.checkEndGame, false);
                _this.addEventListener('endTime',_this.checkEndGame, false);
                _this.addEventListener('newbubble',_this.updateStatsPanel, false);
            });
        };
        _this.exitGame = function() {
            clearInterval(options.checkTimer);  
            _this.removeEventListener('hit',_this.updateStatsPanel); 
            _this.removeEventListener('hit',_this.checkEndGame); 
            _this.removeEventListener('newbubble',_this.checkEndGame); 
            _this.removeEventListener('endTime',_this.updateStatsPanel);
            container.empty(); 
            options.counter= 0;
            container.off('click');
            window.cancelAnimationFrame(rafId);
            rafId = null;
            container.remove();
            if(options.onClose && typeof(options.onClose) == "function") {
                options.onClose.call(this);
            }
        },
        _this.restartGame = function() {
            clearInterval(options.checkTimer);  
            
            container.empty(); 
            options.counter= 0;
            
            stats = {
                totalStars: 0,
                totalClouds: 0,
                totalSun: 0,
                totalMoon: 0,
                totalBubbles: 0,
                totalBubblesHits: 0,
                totalShots: 0,
                shotRating: 0,
                time: Date.now(),
                timeUp: false
            };
            
            options.timeLimit= options.timeLimit * 1000; //x mode2
                
            _this.bubbles = [],
            _this.clouds = [],
            _this.stars = [],
            _this.sun = [],
            _this.moon = [];
            _this.setStatsPanel();
            _this.setTimerPanel();
            _this.setBackground();
            
            _this.addBubble();
            options.checkTimer=setInterval(_this.addBubble,options.timerInterval);
        },
        _this.showMainMenu = function() {
            
            container.html("<div class='mainMenu'>"+
                           "<a href='#' class='startGame'>play</a><br>"+
                           "<a href='#' class='startGameHard'>play hard</a><br>"+
                           "<a href='#' class='startGame2'>play timer</a><br>"+
                           "<a href='#' class='startGameHard2'>play timer hard</a><br>"+
                           "<a href='#' class='exitGame'>exit</a></div>");   
            container.children('.mainMenu').find('a.startGame').one('click',  function(e) {
                e.stopPropagation();
                options.maxBlubles = 5;
                options.mode = 1;
                _this.restartGame();
            });
            container.children('.mainMenu').find('a.startGameHard').one('click', function(e) {
                e.stopPropagation();
                options.maxBlubles = 30;
                options.mode = 1;
                _this.restartGame();
            });
            container.children('.mainMenu').find('a.startGame2').one('click',  function(e) {
                e.stopPropagation();
                options.maxBlubles = 5;
                options.mode = 2;
                options.timeLimit = 30;
                _this.restartGame();
            });
            container.children('.mainMenu').find('a.startGameHard2').one('click', function(e) {
                e.stopPropagation();
                options.maxBlubles = 30;
                options.mode = 2;
                options.timeLimit = 120;
                _this.restartGame();
            });
            container.children('.mainMenu').find('a.exitGame').one('click', function(e) {
                e.stopPropagation();
                _this.exitGame();
            });
            
        },
        _this.checkEndGame = function() {
            if( ( options.mode == 1 && stats.totalBubblesHits == options.maxBlubles ) || ( options.mode == 2 && stats.timeUp === true ) ) {
                //fine gioco   
                _this.bubbles = []; //levo eventual palline restanti
                clearInterval(options.checkTimer); 
                
                container.html("<div class='stats'>Tot shot <i>"+stats.totalShots+"</i> Tot hit <i>"+stats.totalBubblesHits+"</i> ratio <i>"+stats.shotRating+"</i> <br> time "+((Date.now() - stats.time ) / 1000 )+"</div>"+
                               "<div class='endGame'><a href='#' class='restartGame'>play again</a><br><a href='#' class='restartGameHard'>play hard</a><br>"+
                               "<a href='#' class='exitGame'>exit</a></div>");   
                container.children('.endGame').find('a.restartGame').one('click',  function(e) {
                    e.stopPropagation();
                    options.maxBlubles = 5;
                options.mode = 1;
                    _this.restartGame();
                });
                container.children('.endGame').find('a.restartGameHard').one('click', function(e) {
                    e.stopPropagation();
                    options.maxBlubles = 30;
                options.mode = 1;
                    _this.restartGame();
                });
                container.children('.endGame').find('a.exitGame').one('click', function(e) {
                    e.stopPropagation();
                    _this.exitGame();
                });
            }
        },
        _this.setStatsPanel = function() { 
            if(options.mode==1) {
                container.prepend("<div class='stats'>"+
                                  "<i class='bubblesHits'>"+(stats.totalBubbles-stats.totalBubblesHits)+"</i>"+
                                  "/<i class='totalBubbles'>"+options.maxBlubles+"</i>"+
                                  "</div>");   
            }
            else {
                container.prepend("<div class='stats'>"+
                                  "<i class='bubblesHits'>"+(stats.totalBubbles-stats.totalBubblesHits)+"</i>"+
                                  "</div>");   
            }
        },
        _this.setTimerPanel = function () {
                container.prepend("<div class='timer'></div>");  
        },
        _this.updateTimerPanel = function () {
            if(options.mode==2) {
                container.children('.timer').html(parseInt(options.timeLimit / 1000 - ((Date.now() - stats.time ) / 1000 ))); 
            }
            else {
                container.children('.timer').html(parseInt(((Date.now() - stats.time ) / 1000 ))); 
            }
        },
        _this.updateStatsPanel = function(e){
            if(e.type=="hit") {
                container.children('.stats').find('.bubblesHits').html((stats.totalBubblesHits)); 
            }
        },           
        _this.addBubble = function( opts ) {
            var params = $.extend({
                size: Math.random()*0.75 + 1, 
                mass: 1,
                mode: "bubble",
                hidden: ""
            }, opts); 
            
            params.size = Math.round(50 * params.size);
            if(options.mode ==1 && options.counter >= options.maxBlubles) return ;
            else if( _this.bubbles.length >= options.maxBlubles) return ;
            
            stats.totalBubbles ++;
            options.counter ++ ;
            
            if(options.counter == 2 || options.counter ==6) params.mode = 'bomb';
            
            container.append("<div class='"+params.mode+" "+params.hidden+"' id='bubble_"+options.counter+"'><span></span></div>");   
            //container.append("<div class='bubble "+params.hidden+"' id='bubble_"+options.counter+"'></div>");   
            
            var bubble = document.getElementById("bubble_"+options.counter);
             
            bubble.info = {};
            bubble.info.mode = params.mode;
            bubble.info.xspeed = Math.round(Math.random()*8-4),
            bubble.info.yspeed = Math.round(Math.random()*8-4),  
            bubble.info.height = params.size ,// bubble.offsetHeight,
            bubble.info.width = params.size , //bubble.offsetWidth,
            bubble.info.radius = params.size / 2,
            bubble.info.maxPositionTop = container.height() - bubble.info.height,
            bubble.info.maxPositionLeft = container.width() - bubble.info.width,
            bubble.info.id = "bubble_"+options.counter, 
			bubble.info.collision = 0,
    		bubble.info.mass = 1,
    		bubble.info.hit = 0,
    		bubble.info.destroySpeed = Math.round( 500 / ( 1000 / 60 ) ),
    		bubble.info.destroyOpacitySpeed = 1 - ( 1 / bubble.info.destroySpeed ),
    		bubble.info.destroyScaleSpeed = 1 + ( 1 / bubble.info.destroySpeed) ,
    		bubble.info.destroyBlurSpeed = ( 20 / bubble.info.destroySpeed) , 
            bubble.info.position = [];
             
            if(options.debug ===true) console.info('Add bubble: ' + bubble.info.id );
            
            //non voglio movimenti perpendicolari rispetto a x e y
            if(bubble.info.xspeed == 0) bubble.info.xspeed = 1;
            if(bubble.info.yspeed == 0) bubble.info.yspeed = 1;
             
            //init animazione e posizione di partenza
            bubble.style.height = bubble.info.height+'px';
            bubble.style.width = bubble.info.width+'px';
            //bubble.style.top = Math.floor(Math.random() * bubble.info.maxPositionTop)+'px';
            //bubble.style.left = Math.floor(Math.random() * bubble.info.maxPositionLeft)+'px';
            bubble.style.webkitTransform = 'translate3d('+Math.floor(Math.random() * bubble.info.maxPositionLeft)+'px,'+ Math.floor(Math.random() * bubble.info.maxPositionTop)+'px, 0)';
            //bubble.style.backgroundColor = _this.utils.getRandomColor();
            //bubble.style.background = 'radial-gradient(circle at 17px 17px, '+_this.utils.getRandomColor()+', #000'; 
            if(bubble.info.mode =='bomb') {
                bubble.style.background = 'radial-gradient(circle at '+Math.round(params.size/100*34)+'px '+Math.round(params.size/100*34)+'px, #000, #444'; 
            }
            else {
                bubble.style.background = 'radial-gradient(circle at '+Math.round(params.size/100*34)+'px '+Math.round(params.size/100*34)+'px, '+_this.utils.getRandomColor()+', #000'; 
            }
            
            bubble.destroyBubble = function() { 
                bubble.removeEventListener("click", bubble.destroyBubble);
                bubble.removeEventListener("touchstart", bubble.destroyBubble);
                stats.totalBubblesHits ++
                stats.shotRating = ( stats.totalBubblesHits / stats.totalShots ) * 100 ;
                bubble.info.hit = 1; 
                bubble.className = bubble.className + " destroyed";
                bubble.sounds.destroy.play();
                 
                setTimeout(function() { 
                    bubble.parentNode.removeChild(bubble);
                    _this.bubbles = jQuery.grep(_this.bubbles, function( n, i ) {
                      return ( n !== bubble );
                    }); 
                    _this.dispatchEvent(new CustomEvent("hit", { "detail": bubble }));  
                },500); 
            };
            
            bubble.sounds = {
                bounce: new Audio("audio/pong.wav"), // buffers automatically when created
                destroy: new Audio("audio/hit.wav") // buffers automatically when created
            };
             
            bubble.addEventListener("click", bubble.destroyBubble);
            bubble.addEventListener("touchstart", bubble.destroyBubble);
        
            _this.bubbles.push(bubble); 
            _this.dispatchEvent(new CustomEvent("newbubble", { "detail": bubble })); 
        }, 
        _this.animateFrame = function() {
            _this.updateBackground();  
            _this.updateTimerPanel();
            _this.moveBubbles(); 
            _this.manageCollisions();
            if( options.mode == 2 && stats.timeUp === false && ((Date.now() - stats.time ) ) >= options.timeLimit ) {
                stats.timeUp = true; 
                _this.dispatchEvent(new CustomEvent("endTime", { "detail": "" })); 
            }
            
            requestAnimFrame( _this.animateFrame );
        },
        _this.manageCollisions = function() {
            var distance_x , distance_y , distance;
             
            $.each(_this.bubbles,function() {
                b1 = this; 
                b1.index = _this.bubbles.indexOf(b1);
                $.each(_this.bubbles.slice( b1.index +1 ) ,function() {
                    b2 = this;  
                    b2.index = _this.bubbles.indexOf(b2);
                    if( b1.info.hit != 1 && b2.info.hit != 1) {
                        //distance_x = Math.abs(b1.info.position[1]-b2.info.position[1]);
                        //distance_y = Math.abs(b1.info.position[0]-b2.info.position[0]);
                        //distance   = Math.sqrt(distance_x*distance_x+distance_y*distance_y);
                        //
                        distance_x = Math.abs((b2.info.position[1]+b2.info.radius) - (b1.info.position[1]+b1.info.radius));
                        distance_y = Math.abs((b2.info.position[0]+b2.info.radius) - (b1.info.position[0]+b1.info.radius));
                        distance   = Math.sqrt(distance_x*distance_x+distance_y*distance_y) - (b1.info.radius + b2.info.radius );
                        //
                            //sqrt((x2 − x1)^2 + (y2 − y1)^2) − (r2 + r1)
                        if ( distance<=0 /*Math.abs(distance)<=b1.info.width || Math.abs(distance)<=b2.info.width) */ && (jQuery.inArray( (b1.index-1)+"-"+(b2.index-1), _this.bubblesCollisions ) <0 )) 
                        {
                            _this.bubblesCollisions.push((b1.index-1)+"-"+(b2.index-1));
                            
                            dx = b1.info.position[1]-b2.info.position[1];
                            dy = b1.info.position[0]-b2.info.position[0];
                            collisionision_angle = Math.atan2(dy, dx);
                             

                            magnitude_1 = Math.sqrt(b1.info.xspeed*b1.info.xspeed+b1.info.yspeed*b1.info.yspeed);
                            magnitude_2 = Math.sqrt(b2.info.xspeed*b2.info.xspeed+b2.info.yspeed*b2.info.yspeed);

                            direction_1 = Math.atan2(b1.info.yspeed, b1.info.xspeed);
                            direction_2 = Math.atan2(b2.info.yspeed, b2.info.xspeed);

                           
                            new_xspeed_1 = magnitude_1*Math.cos(direction_1-collisionision_angle);
                            new_yspeed_1 = magnitude_1*Math.sin(direction_1-collisionision_angle);
                            new_xspeed_2 = magnitude_2*Math.cos(direction_2-collisionision_angle);
                            new_yspeed_2 = magnitude_2*Math.sin(direction_2-collisionision_angle);

                            final_xspeed_1 = ((b1.info.mass-b2.info.mass)*new_xspeed_1+(b2.info.mass+b2.info.mass)*new_xspeed_2)/(b1.info.mass+b2.info.mass);
                            final_xspeed_2 = ((b1.info.mass+b1.info.mass)*new_xspeed_1+(b2.info.mass-b1.info.mass)*new_xspeed_2)/(b1.info.mass+b2.info.mass);
                            final_yspeed_1 = new_yspeed_1;
                            final_yspeed_2 = new_yspeed_2;

                            b1.info.xspeed = Math.cos(collisionision_angle)*final_xspeed_1+Math.cos(collisionision_angle+Math.PI/2)*final_yspeed_1;
                            b1.info.yspeed = Math.sin(collisionision_angle)*final_xspeed_1+Math.sin(collisionision_angle+Math.PI/2)*final_yspeed_1;
                            b2.info.xspeed = Math.cos(collisionision_angle)*final_xspeed_2+Math.cos(collisionision_angle+Math.PI/2)*final_yspeed_2;
                            b2.info.yspeed = Math.sin(collisionision_angle)*final_xspeed_2+Math.sin(collisionision_angle+Math.PI/2)*final_yspeed_2;
                            
                            
                            b1.sounds.bounce.pause();
                            b1.sounds.bounce.currentTime = 0; 
                            b1.sounds.bounce.play();
                
                        }
                        else if (distance>0 /*Math.abs(distance)>b1.info.width && Math.abs(distance)>b2.info.width*/) 
                        { 
                            _this.bubblesCollisions = jQuery.grep(_this.bubblesCollisions, function( n, i ) {
                              return ( n !== (b1.index-1)+"-"+(b2.index-1) );
                            });
                        }
                    }
                    
                });
            });
        },
        _this.moveBubbles = function() {
            var h , w , nh , nw , position , bubble ;
            $.each(_this.bubbles,function() {  
                bubble = this , 
                position = bubble.getBoundingClientRect(),
                bubble.info.position = [Math.round(position.top - container.info.position.top),Math.round(position.left - container.info.position.left)],
                h = bubble.info.maxPositionTop,
                w = bubble.info.maxPositionLeft;
                 
                nw = bubble.info.position[1] ;
                nh = bubble.info.position[0] ;  
                
                if(bubble.info.hit != 1 ) {
                    if (bubble.info.position[1]<0) { 
                        bubble.sounds.bounce.pause();
                        bubble.sounds.bounce.currentTime = 0;
                        nw = 0; bubble.info.xspeed *= -1;
                        bubble.sounds.bounce.play();
                    }  // BOUNDRIES Left
                    if (bubble.info.position[1]>w) { 
                        bubble.sounds.bounce.pause();
                        bubble.sounds.bounce.currentTime = 0;
                        nw = w; bubble.info.xspeed *= -1; 
                        bubble.sounds.bounce.play();
                    }  // BOUNDRIES Right
                    if (bubble.info.position[0]<0) { 
                        bubble.sounds.bounce.pause();
                        bubble.sounds.bounce.currentTime = 0;
                        nh = 0; bubble.info.yspeed *= -1;
                        bubble.sounds.bounce.play();
                    }   // BOUNDRIES Top
                    if (bubble.info.position[0]>h) { 
                        bubble.sounds.bounce.pause();
                        bubble.sounds.bounce.currentTime = 0;
                        nh = h; bubble.info.yspeed *= -1;
                        bubble.sounds.bounce.play();
                    }	// BOUNDRIES Bottom

                    nw += bubble.info.xspeed;
                    nh += bubble.info.yspeed;   
                    //bubble.style.top = nh+'px';
                    //bubble.style.left = nw+'px'; 
                    bubble.style.webkitTransform = 'translate3d('+nw+'px,'+ nh+'px, 0)';
                    bubble.info.position[1] =nw;
                    bubble.info.position[0] =nh;  
                } 
                else {   
                    bubble.style.opacity = bubble.info.destroyOpacitySpeed;
                    bubble.style.top = nh+'px';
                    bubble.style.left = nw+'px'; 
                    
                    if(bubble.info.mode == 'bomb'){
                        //'+nw+'px,'+ nh+'px,
                        bubble.style.webkitTransform = 'translateZ( 0) scale(2,2)';   
                    }
                    else {
                        //transform-style: preserve-3d
                        //bubble.style.transformStyle= 'preserve-3d';
                        bubble.style.webkitTransform = 'translateZ(0) ';
                        //scale('+bubble.info.destroyScaleSpeed+','+bubble.info.destroyScaleSpeed+')'; 
                        //bubble.style.opacity =bubble.info.destroyOpacitySpeed; 
                        bubble.style.webkitFilter = 'blur('+bubble.info.destroyBlurSpeed+'px)'; 
                    }
                    bubble.info.destroyOpacitySpeed = bubble.info.destroyOpacitySpeed - ( 1 / bubble.info.destroySpeed );
                    bubble.info.destroyScaleSpeed = bubble.info.destroyScaleSpeed + ( 1 / bubble.info.destroySpeed) ;
    		        bubble.info.destroyBlurSpeed = bubble.info.destroyBlurSpeed + ( 20 / bubble.info.destroySpeed) ; 
                }
            });
             
            if(options.debug ===true) console.info('Move bubbles ' ); 
        },
        _this.setBackground = function() { 
            
       //     _this.removeEventListener('morning'); 
        //    _this.removeEventListener('noon'); 
        //    _this.removeEventListener('afternoon'); 
        //    _this.removeEventListener('midnight'); 
            
            _this.style.backgroundColor = '#87FAEC';
            _this.style.transition = 'background linear 10s';
            
            _this.addEventListener('noon',function(){
                if(options.debug === true) console.log('noon - verso afternoon');
                _this.style.backgroundColor = '#FA87CE';
            }, false);
            _this.addEventListener('afternoon',function(){
                if(options.debug === true) console.log('afternoon - verso midnight');
                _this.style.backgroundColor = '#325f7c';
                _this.turnOnStars();
            }, false);
            _this.addEventListener('midnight',function(){
                if(options.debug === true) console.log('midnight - verso morning');
                _this.style.backgroundColor = '#87BBFA';
                _this.turnOffStars(); 
            }, false);
            _this.addEventListener('morning',function(){
                if(options.debug === true) console.log('morning - verso noon');
                _this.style.backgroundColor = '#87FAEC';
            }, false);
            
            _this.addSun();
            _this.addMoon();
            
            for(i = 0 ; i < 15 ; i ++ ) _this.addCloud(); 
            for(i = 0 ; i < 45 ; i ++ ) _this.addStar(); 
        },
        _this.updateBackground = function() {  
            
            now = Date.now();
            delta = now - then;
            if (delta > options.background.frameInterval) {
                then = now - (delta % options.background.frameInterval);
                _this.moveClouds();
                _this.moveSun();
                _this.moveMoon();
            }
            
        },
        _this.addSun = function( opts ) {
             
            stats.totalSun ++;
            options.background.counter ++ ;
            container.append("<div class='sun  ' id='sun_"+options.background.counter+"'><span></span></div>");    
            
            var sun = document.getElementById("sun_"+options.background.counter);
             
            sun.info = {}; 
            sun.info.height = sun.offsetHeight,
            sun.info.width = sun.offsetWidth, 
			sun.info.radius = sun.info.width / 2,
			sun.info.containerRadiusLeft = container.width() - sun.info.width,
			sun.info.containerRadiusTop = container.height() - sun.info.height,
            sun.info.deg2rad = Math.PI / 180,
            sun.info.angle = 0,
            sun.info.angleSpeed = 0.25,//0.01, 
            sun.info.id = "sun_"+options.background.counter; 
            
            if(options.debug ===true) console.info('Add sun: ' + sun.info.id );
            
            sun.info.startPositionLeft = - sun.info.containerRadiusLeft * Math.cos(sun.info.angle * sun.info.deg2rad),
            sun.info.startPositionTop = - sun.info.containerRadiusTop * Math.sin(sun.info.angle * sun.info.deg2rad);
 
            //init animazione e posizione di partenza 
            sun.style.webkitTransform = 'translate3d('+sun.info.startPositionLeft+'px ,'+sun.info.startPositionTop+'px, 0) '; 
              
            _this.sun.push(sun); 
            _this.dispatchEvent(new CustomEvent("newsun", { "detail": sun })); 
        },   
        _this.addMoon = function( opts ) {
             
            stats.totalMoon ++;
            options.background.counter ++ ;
            container.append("<div class='moon  ' id='moon_"+options.background.counter+"'><span></span></div>");    
            
            var moon = document.getElementById("moon_"+options.background.counter);
             
            moon.info = {}; 
            moon.info.height = moon.offsetHeight,
            moon.info.width = moon.offsetWidth, 
			moon.info.radius = moon.info.width / 2,
			moon.info.containerRadiusLeft = container.width() - moon.info.width,
			moon.info.containerRadiusTop = container.height() - moon.info.height,
            moon.info.deg2rad = Math.PI / 180,
            moon.info.angle = 180,
            moon.info.angleSpeed = 0.25,//0.01, 
            moon.info.id = "moon_"+options.background.counter; 
            
            if(options.debug ===true) console.info('Add moon: ' + moon.info.id );
            
            moon.info.startPositionLeft = - moon.info.containerRadiusLeft * Math.cos(moon.info.angle * moon.info.deg2rad),
            moon.info.startPositionTop = - moon.info.containerRadiusTop * Math.sin(moon.info.angle * moon.info.deg2rad);
 
            //init animazione e posizione di partenza 
            moon.style.webkitTransform = 'translate3d('+moon.info.startPositionLeft+'px ,'+moon.info.startPositionTop+'px, 0) rotate(135deg) '; 
              
            _this.moon.push(moon); 
            _this.dispatchEvent(new CustomEvent("newmoon", { "detail": moon })); 
        },    
        _this.moveSun = function() {
            var nh , nw , sun ;
            $.each(_this.sun,function() {  
                sun = this ;
                sun.info.angle += sun.info.angleSpeed;
                
                nw = - sun.info.containerRadiusLeft * Math.cos(sun.info.angle * sun.info.deg2rad),
                nh = - sun.info.containerRadiusTop * Math.sin(sun.info.angle * sun.info.deg2rad);
                
                if(Math.abs(sun.info.angle) == 360 ) sun.info.angle = 0;
            
                sun.style.webkitTransform = 'translate3d('+nw+'px ,'+nh+'px, 0) '; 
                
                if(sun.info.angle == 0) _this.dispatchEvent(new CustomEvent("morning", { "detail": sun })); 
                if(sun.info.angle == 90) _this.dispatchEvent(new CustomEvent("noon", { "detail": sun })); 
                if(sun.info.angle == 180) _this.dispatchEvent(new CustomEvent("afternoon", { "detail": sun })); 
                if(sun.info.angle == 270) _this.dispatchEvent(new CustomEvent("midnight", { "detail": sun })); 
            });
        },   
        _this.moveMoon = function() {
            var nh , nw , moon ;
            $.each(_this.moon,function() {  
                moon = this ;
                moon.info.angle += moon.info.angleSpeed;
                
                nw = - moon.info.containerRadiusLeft * Math.cos(moon.info.angle * moon.info.deg2rad),
                nh = - moon.info.containerRadiusTop * Math.sin(moon.info.angle * moon.info.deg2rad);
            
                if(Math.abs(moon.info.angle) == 360 ) moon.info.angle = 0;
                
                moon.style.webkitTransform = 'translate3d('+nw+'px ,'+nh+'px, 0) rotate(135deg) '; 
            });
        },
        _this.addStar = function( opts ) {
            
            var params = $.extend({
                size: Math.random() * 2 + 1
            }, opts); 
            
            params.size = Math.round(params.size); 
            params.size = params.size.toFixed(2); 
            
            stats.totalStars ++;
            options.background.counter ++ ;
            // star_"+params.size+"
            container.append("<div class='star' id='star_"+options.background.counter+"'><span></span></div>");  
            
            var star = document.getElementById("star_"+options.background.counter);
             
            star.info = {};
            star.info.height = /*params.size ,*/ star.offsetHeight,
            star.info.width = /*params.size ,*/star.offsetWidth,
            star.info.maxPositionTop = container.height() - star.info.height,
            star.info.maxPositionLeft = container.width() - star.info.width,
            star.info.id = "star_"+options.background.counter,
            star.info.position = []; 
            
            star.style.transition = 'opacity linear 5s';
            star.style.webkitTransform = 'translate3d('+Math.floor(Math.random() * star.info.maxPositionLeft)+'px,'+ Math.floor(Math.random() * star.info.maxPositionTop)+'px, 0) scale('+params.size+','+params.size+')'; 
            
            
            if(options.debug ===true) console.info('Add star: ' + star.info.id ); 
            _this.stars.push(star); 
            _this.dispatchEvent(new CustomEvent("newstar", { "detail": star })); 
            
        },
        _this.turnOnStars = function() {
            var  star ;
            $.each(_this.stars,function() {  
                star = this ;
                 
                star.style.opacity = 1; 
            });
        },
        _this.turnOffStars = function() {
            var  star ;
            $.each(_this.stars,function() {  
                star = this ;
                 
                star.style.opacity = 0; 
            });
        },
        _this.addCloud = function( opts ) {
            
            var params = $.extend({
                size: Math.random() * 2
            }, opts); 
            
            params.size = Math.round(params.size); 
            
            stats.totalClouds ++;
            options.background.counter ++ ;
            container.append("<div class='cloud cloud_"+params.size+"' id='cloud_"+options.background.counter+"'><span></span></div>");   
            //container.append("<div class='bubble "+params.hidden+"' id='bubble_"+options.counter+"'></div>");   
            
            var cloud = document.getElementById("cloud_"+options.background.counter);
             
            cloud.info = {};
            cloud.info.xspeed = ( Math.random()*1),
            cloud.info.yspeed = 0,  
            cloud.info.height = /*params.size ,*/ cloud.offsetHeight,
            cloud.info.width = /*params.size ,*/cloud.offsetWidth,
            cloud.info.maxPositionTop = container.height() - cloud.info.height,
            cloud.info.maxPositionLeft = container.width() - cloud.info.width,
            cloud.info.id = "cloud_"+options.background.counter,
            cloud.info.position = [];
			/*bubble.info.radius = params.size / 2,
            bubble.info.collision = 0,
    		bubble.info.mass = 1,
    		bubble.info.hit = 0,
    		bubble.info.destroySpeed = Math.round( 500 / ( 1000 / 60 ) ),
    		bubble.info.destroyOpacitySpeed = 1 - ( 1 / bubble.info.destroySpeed ),
    		bubble.info.destroyScaleSpeed = 1 + ( 1 / bubble.info.destroySpeed) ,
    		bubble.info.destroyBlurSpeed = ( 20 / bubble.info.destroySpeed) , 
            */
             
            if(options.debug ===true) console.info('Add cloud: ' + cloud.info.id );
            
            //non voglio movimenti perpendicolari rispetto a x e y
            if(cloud.info.xspeed == 0) cloud.info.xspeed = 1;
            //if(bubble.info.yspeed == 0) bubble.info.yspeed = 1;
             
            //init animazione e posizione di partenza
            //bubble.style.height = bubble.info.height+'px';
            //bubble.style.width = bubble.info.width+'px'; 
            cloud.style.webkitTransform = 'translate3d('+Math.floor(Math.random() * cloud.info.maxPositionLeft)+'px,'+ Math.floor(Math.random() * cloud.info.maxPositionTop)+'px, 0) scale(5,5)'; 
            //bubble.style.background = 'radial-gradient(circle at '+Math.round(params.size/100*34)+'px '+Math.round(params.size/100*34)+'px, '+_this.utils.getRandomColor()+', #000'; 
             
        
            _this.clouds.push(cloud); 
            _this.dispatchEvent(new CustomEvent("newcloud", { "detail": cloud })); 
        },   
        _this.moveClouds = function() {
            var h , w , nh , nw , position , cloud ;
            $.each(_this.clouds,function() {  
                cloud = this , 
                position = cloud.getBoundingClientRect(),
                cloud.info.position = [ position.top - container.info.position.top , position.left - container.info.position.left ],
                h = cloud.info.maxPositionTop,
                w = cloud.info.maxPositionLeft;
                 
                nw = cloud.info.position[1] ;
                nh = cloud.info.position[0] ;  
                 
                    if (cloud.info.position[1]<(0 - cloud.info.width)) {  
                        nw = w + cloud.info.width; 
                        //cloud.info.xspeed *= -1; 
                    }  // BOUNDRIES Left
                    else if (cloud.info.position[1]> (w + cloud.info.width)) {  
                        nw = 0 - cloud.info.width; 
                        //cloud.info.xspeed *= -1;  
                    }  // BOUNDRIES Right
                    else {
                        nw += cloud.info.xspeed;
                    }
                    if (cloud.info.position[0]<0) {  
                        nh = 0; cloud.info.yspeed *= -1; 
                    }   // BOUNDRIES Top
                    else if (cloud.info.position[0]>h) {  
                        nh = h; cloud.info.yspeed *= -1; 
                    }	// BOUNDRIES Bottom
                    else {
                        nh += cloud.info.yspeed;   
                    }
                    //bubble.style.top = nh+'px';
                    //bubble.style.left = nw+'px'; 
                    cloud.style.webkitTransform = 'translate3d('+nw+'px,'+ nh+'px, 0) ';
                    cloud.info.position[1] =nw;
                    cloud.info.position[0] =nh;   
            });
             
            if(options.debug ===true) console.info('Move cloud ' ); 
        },
        _this.utils = {
            getRandomColor: function (){
                var letters = '0123456789ABCDEF'.split('');
                var color = '#';
                for (var i = 0; i < 6; i++ ) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            }
        };
        
        _this.init();
    };
})( jQuery );