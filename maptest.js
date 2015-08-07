/**
 * Setup all visualization elements when the page is loaded. 
 */
$(function() {
    // Connect to ROS.
    var HOSTNAME = '';
    var HOSTNAME = 'EN4102960.local';
    var match = RegExp('[?&]hostname=([^&]*)').exec(window.location.search);
    var q_host =  match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    var ALT_VIDEOTOPIC = "/camera/rgb/image_color";
    var VIDEOTOPIC = "/canon_camera";

    var randomString = function(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for(var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    HOSTNAME = q_host || HOSTNAME || window.location.hostname || "127.0.0.1";
    console.log('HOSTNAME: '  + HOSTNAME);
    $('video.camera')[0].src = "http://" + HOSTNAME + ":9091/stream?topic=" + VIDEOTOPIC + "&width=320&height=240&quality=65&type=vp8&break_cache=" + randomString(8);
    $('#vid-from')[0].innerHTML = VIDEOTOPIC;

    function switch_vid() {
        var v = $('video.camera')[0]
        var tmp = VIDEOTOPIC;
        VIDEOTOPIC = ALT_VIDEOTOPIC;
        ALT_VIDEOTOPIC = tmp;
        v.src = "http://" + HOSTNAME + ":9091/stream?topic=" + VIDEOTOPIC + "&width=320&height=240&quality=65&type=vp8&break_cache=" + randomString(8);
        $('#vid-from')[0].innerHTML = VIDEOTOPIC;
    }

    $('#change_vid').click(switch_vid);
    var ros = new ROSLIB.Ros({
        url : 'ws://' + HOSTNAME + ':9090'
    });
    document.ros = ros;
    
    function debugout(data){
        console.log(data);
    }
    
    function print_rosout(data) {
        if (data.level > 2) {
            var node = document.createElement("div");
            var timestamp = new Date(0)
            timestamp.setUTCSeconds(data.header.stamp.secs)
            timestamp = timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds()
            node.innerHTML = "<b>[" + timestamp + " " + data.name + "]</b> " + data.msg;
            document.getElementById('rosout').appendChild(node);
        }
    }
    
    document.ros.Topic({ros:document.ros, name:'/rosout'}).subscribe(print_rosout);
    
    function update_action(data) {
        $('#current_action_name')[0].innerHTML = data.name + ' [' + data.action_id + ']';
        var params = $('#current_action_params').empty()[0];
        $.each(data.parameters, function(i) {
            var param = data.parameters[i];
            //console.log(param);
            var node = document.createElement("li");
            node.innerHTML =  param.key + ": <b>" + param.value+ "</b>";
            params.appendChild(node);
        });
    }
    document.ros.Topic({ros:document.ros, name:'/kcl_rosplan/action_dispatch'}).subscribe(update_action);
    
    
    function update_battery(data) {
        $('#battery').text(data.data.toFixed(2));
        $('#battery_meter').val(data.data);
    }
    document.ros.Topic({ros:document.ros, name:'/RosAria/battery_voltage'}).subscribe(update_battery);
   
    function speak(words) {
        var tts = ROSLIB.Topic({ros:document.ros,
                                name:"/tosay",
                                messageType:"std_msgs/String"});
        var msg = ROSLIB.Message({data:words});
        tts.publish(msg);
   }

    var default_msg = $("<div class='bg-success'>Nothing to report</div>");
    $('#prompts').append(default_msg);
    function tty(msg, bkgd) {
        bkgd = typeof bkgd !== 'undefined' ? bkgd : 'bg-warning';
        console.log(msg);
        var msg_el = $("<div class='" + bkgd + "'>" + msg + '</div>');
        default_msg.remove()
        $('#prompts').append(msg_el);
        setTimeout(function () {
            msg_el.fadeOut().remove();
            if (!$('#prompts').children().length) {
                $('#prompts').append(default_msg);
        }}, 5000);
    }
    document.ros.Topic({ros:document.ros,
                        name:"/tosay",
                        messageType:"std_msgs/String"}).subscribe(function(msg){return tty(msg.data);});
    document.ros.Topic({ros:document.ros,
                        name:"/heard",
                        messageType:"std_msgs/String"}).subscribe(
                            function(msg){return tty(msg.data, 'bg-info');}
                            );
    document.tty = tty;

    function planner_cmd(s) {
        var cmd = ROSLIB.Topic({ros:document.ros,
                                name:"/kcl_rosplan/planning_commands",
                                messageType:"std_msgs/String"});
        var msg = ROSLIB.Message({data:s});
        cmd.publish(msg);
    }

    $('#abort').click("cancel", switch_vid);
    $('#pause').click("pause", switch_vid);

});
