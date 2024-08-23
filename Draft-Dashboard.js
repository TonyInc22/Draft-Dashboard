var currPick = '0-12';
const league = '1090755136630104064';
const draft = '1090755136630104065';
const testDraft = '1132671922631929856';
var timerInterval;
var pickTimer;
var lastPick;
var userAvatars = {};
var breakLoop = false;

$(prepareBoard)

// Pull all league users and fill the draft board with the results
function prepareBoard() {
    $.ajax({
		type: 'GET',
		url: 'https://api.sleeper.app/v1/draft/'+draft,
        async: true,
		success: function(data) {
            if (!data) window.location.reload();
			console.log('Draft Data:',data);

            // Sort the users by draft_order, then create each column of the dashboard while adding the avatar content
            Object.keys(data.draft_order)
                .sort((a, b) => data.draft_order[a] - data.draft_order[b])
			    .forEach((userID, i) => {
                    $.ajax({
                        type: 'GET',
                        url: 'https://api.sleeper.app/v1/user/'+userID,
                        async: false,
                        success: data => {
                            console.log('User Data:', data);
                            userAvatars[userID] = {'avatar': data.avatar, 'draftOrder': i};
                            
                            $('.dashboardContainer').append(
                                '<div class="dashColumn">'+
                                    '<div class="avatarContainer">'+
                                        '<img src="https://sleepercdn.com/avatars/thumbs/'+data.avatar+'">'+
                                        '<div>'+data.display_name+'</div>'+
                                    '</div>'+
                                    [...Array(14)].reduce((ret, _, x) => {
                                        const pickID = (x + 1)+'-'+(x % 2 == 0 ? i + 1 : 12 - i);
                                        return ret + '<div id="'+pickID+'" class="pickContainer">'+
                                            '<div class="pick">'+pickID.replace('-','.')+'</div>'+
                                            '<div class="direction"><img src="'+'https://sleepercdn.com/images/v2/ui/icon_arrow_'+(x % 2 == 0 ? 'right' : 'left')+'.png"></img></div>'+
                                        '</div>'
                                    }, '')+
                                '</div>'
                            )

                        }
                    })
                })

            // Start timer until the draft begins
            // var seconds = (data.start_time - new Date()) / 1000;
            var seconds = 0; // THIS IS FOR TESTING PURPOSES, THE COMMENTED ONE ABOVE IS THE REAL TIME UNTIL THE DRAFT
            function timer() {
                var days        = Math.floor(seconds/24/60/60);
                var hoursLeft   = Math.floor((seconds) - (days*86400));
                var hours       = Math.floor(hoursLeft/3600);
                var minutesLeft = Math.floor((hoursLeft) - (hours*3600));
                var minutes     = Math.floor(minutesLeft/60);
                var remainingSeconds = Math.floor(seconds % 60);

                $('.Days').text(days)
                $('.Hours').text(hours)
                $('.Minutes').text(minutes)
                $('.Seconds').text(remainingSeconds)

                if (seconds === -1) {
                    clearInterval(timerInterval);
                    $('.modal').remove();
                    incrementPick();
                    getPicks();
                } else {
                    seconds--;
                }
            }
            timerInterval = setInterval(timer, 1000);
        }
    });
}

// Pull draft picks and update the draft board with any new ones
function getPicks() {
    if (breakLoop) return;
    $.ajax({
		type: 'GET',
		url: 'https://api.sleeper.app/v1/draft/'+testDraft+'/picks',
        async: true,
		success: function(data) {
			// console.log('Picks: ', data);
            if (!data || !data.length) return;

            lastPick = data[data.length-1];

            var endDraft = false;

            data.forEach(pick => {
                var pickID = pick.round + '-' + (pick.pick_no % 12 === 0 ? 12 : pick.pick_no % 12);

                if (pickID === currPick) {
                    $('.currentPick').removeClass('currentPick')

                    // Format player details
                    var playerName = pick.metadata.first_name[0]+'. '+pick.metadata.last_name;
                    var playerInfo = pick.metadata.position+' - '+pick.metadata.team+' ('+getBye(pick.metadata.team)+')';
                    var playerAvatar = 'https://sleepercdn.com/content/nfl/players/thumb/'+pick.metadata.player_id+'.jpg';
                    if (!/\d+/.test(pick.metadata.player_id)) {
                        playerAvatar = "https://sleepercdn.com/images/team_logos/nfl/"+pick.metadata.team.toLowerCase()+".png"
                    }

                    // Add player details to the pick container
                    $('.pickContainer#'+pickID).css('background', getColor(pick.metadata.position))
                    $('.pickContainer#'+pickID).append('<div class="player">'+playerName+'</div>')
                    $('.pickContainer#'+pickID).append('<div class="playerInfo">'+playerInfo+'</div>')
                    $('.pickContainer#'+pickID).append('<div class="playerAvatar"><img src="'+playerAvatar+'"></img></div>')
                    $('.pickContainer#'+pickID).find('.onTheClock').remove();
                    $('.pickContainer#'+pickID).find('.pick').css('color', 'rgb(52, 64, 84)');

                    endDraft = incrementPick();
                }
            })

            if (endDraft) {
                $('.timerContainer, .videoContainer').remove();

                $('.dashboardContainer').css('height','100vh');
                $('.dashboardContainer')[0].scroll(0,0);
            } else getPicks();
		}
    });
}

// Calculate the new pickID, update the current pick container and global variable
function incrementPick() {
    clearInterval(pickTimer);

    // Calculate the new pick ID
    var [row, column] = currPick.split('-');
    if (Number(column) === 12) {
        // Scroll to the current pick
        var scroll = $('.pickContainer#'+currPick).prop('offsetTop');
        scroll = Math.max(scroll-120, 0);
        $('.dashboardContainer').animate({scrollTop: scroll}, 1500);

        row = Number(row) + 1
        column = 1;
    } else column = Number(column) + 1;
    currPick = row + '-' + column;

    // End the draft beacuse we have ran out of draft picks
    if (row === 15) return true;
    
    // Add the 'On The Clock' text and format the container
    $('.pickContainer#'+currPick)
        .addClass('currentPick')
        .append('<div class="onTheClock">On The Clock</div>');
    $('.pickContainer#'+currPick).find('.direction img').attr('src','https://sleepercdn.com/images/v2/ui/icon_arrow_right_dark_2.png');
    if (row % 2 === 0) $('.pickContainer#'+currPick).find('.direction img').css('transform', 'rotate(180deg)')

    updatePickTimer();

    return false;
}

function getBye(team) {
    switch (team) {
        case "DET":
        case "LAC":
        case "PHI":
        case "TEN":
            return 5;
        case "KAN":
        case "LAR":
        case "MIA":
        case "MIN":
            return 6;
        case "CHI":
        case "DAL":
            return 7;
        case "PIT":
        case "SF":
            return 9;
        case "CLE":
        case "GB":
        case "LV":
        case "SEA":
            return 10;
        case "ARI":
        case "CAR":
        case "NYG":
        case "TB":
            return 11;
        default:
            return 12;
    }
}
function getColor(position) {
    switch(position) {
        case 'WR': 
            return 'rgba(86, 201, 248, 0.8)';
        case 'RB': 
            return 'rgba(143, 242, 202, 0.8)';
        case 'QB': 
            return 'rgba(239, 116, 161, 0.8)';
        case 'TE': 
            return 'rgba(254, 174, 88, 0.8)';
        case 'DEF': 
            return 'rgba(191, 117, 93, 0.8)';
        case 'K': 
            return 'rgba(182, 185, 255, 0.8)';
    }
}

function updatePickTimer() {
    if (!lastPick) return;

    var pickNo = lastPick.pick_no;

    var playerAvatar = 'https://sleepercdn.com/content/nfl/players/thumb/'+lastPick.metadata.player_id+'.jpg';
    if (!/\d+/.test(lastPick.metadata.player_id)) {
        playerAvatar = "https://sleepercdn.com/images/team_logos/nfl/"+lastPick.metadata.team.toLowerCase()+".png"
    }
    var userAvatar = 'https://sleepercdn.com/landing/web2021/img/sleeper-app-logo-2.png';
    if (userAvatars[lastPick.picked_by]) {
        userAvatar = 'https://sleepercdn.com/avatars/thumbs/' + userAvatars[lastPick.picked_by].avatar;
    }
    $('.pickCard:first-child').find('.pickAvatar').html('<img src="'+userAvatar+'">')
    $('.pickCard:first-child').find('.pickRoundNumber').text(lastPick.round)
    $('.pickCard:first-child').find('.pickIDNumber').text(pickNo)
    $('.pickCard:first-child').find('.pickPlayer').text(lastPick.metadata.first_name[0]+'. '+lastPick.metadata.last_name)
    $('.pickCard:first-child').find('.pickPlayerInfo').text(lastPick.metadata.position+' - '+lastPick.metadata.team+' ('+getBye(lastPick.metadata.team)+')')
    $('.pickCard:first-child').find('.pickPlayerAvatar').html('<img src="'+playerAvatar+'"></img>')

    for (i = 1; i < 3; i++) {
        pickNo += 1;

        var currOrder = pickNo % 12 === 0 ? 12 : pickNo % 12;
        var roundNo = (pickNo/12 + 1 + '').split('.')[0];
        if (roundNo % 2 === 0) currOrder = 13 - currOrder;

        userAvatar = 'https://sleepercdn.com/landing/web2021/img/sleeper-app-logo-2.png';
        Object.keys(userAvatars).some(user => {
            if (userAvatars[user].draftOrder === currOrder - 1) {
                userAvatar = 'https://sleepercdn.com/avatars/thumbs/' + userAvatars[user].avatar;
                return true;
            }
            return false;
        }) 

        $('.pickCard:eq('+i+')').find('.pickAvatar').html('<img src="'+userAvatar+'">')
        $('.pickCard:eq('+i+')').find('.pickRoundNumber').text(roundNo)
        $('.pickCard:eq('+i+')').find('.pickIDNumber').text(pickNo)
    }

    var currRound = Number($('.pickCard:eq(1)').find('.pickRoundNumber').text());
    var draftTime = currRound > 3 ? 3 : 5;
    var seconds = draftTime * 60; // THIS IS FOR TESTING PURPOSES, THE COMMENTED ONE ABOVE IS THE REAL TIME UNTIL THE DRAFT
    function timer() {
        var days        = Math.floor(seconds/24/60/60);
        var hoursLeft   = Math.floor((seconds) - (days*86400));
        var hours       = Math.floor(hoursLeft/3600);
        var minutesLeft = Math.floor((hoursLeft) - (hours*3600));
        var minutes     = Math.floor(minutesLeft/60);
        var remainingSeconds = Math.floor(seconds % 60);

        $('.pickTime').text(minutes+':'+((remainingSeconds + '').length < 2 ? ('0' + remainingSeconds) : remainingSeconds))

        if (seconds === -1) {
            clearInterval(pickTimer);
            $('.modal').remove();
            incrementPick();
            getPicks();
        } else {
            seconds--;
        }
    }
    pickTimer = setInterval(timer, 1000);
}