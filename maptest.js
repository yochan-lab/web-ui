/**
 * Setup all visualization elements when the page is loaded. 
 */
$(function() {
    // Connect to ROS.
    var HOSTNAME = '';
    var HOSTNAME = '10.143.21.252';
    var VIDEOTOPIC = "/camera/rgb/image_color";
    var ALT_VIDEOTOPIC = "/canon_camera";
    if (HOSTNAME == "") {
        HOSTNAME = window.location.hostname || "127.0.0.1";
        $('video.camera')[0].src = "http://" + HOSTNAME + ":9091/stream?topic=" + VIDEOTOPIC + "&width=320&height=240&quality=65&type=vp8";
        $('#vid-from')[0].innerHTML = VIDEOTOPIC;
    }

    function switch_vid() {
        var v = $('video.camera')[0]
        var tmp = VIDEOTOPIC;
        VIDEOTOPIC = ALT_VIDEOTOPIC;
        ALT_VIDEOTOPIC = tmp;
        v.src = "http://" + HOSTNAME + ":9091/stream?topic=" + VIDEOTOPIC + "&width=320&height=240&quality=65&type=vp8";
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


    function tty(msg) {
        console.log(msg.data);
        $('#prompts')[0].innerHTML = msg.data;
        $('#prompts').removeClass('bg-success').addClass('bg-warning');
        setTimeout(function () {
            if ($('#prompts')[0].innerHTML == msg.data) {
                $('#prompts')[0].innerHTML = "Nothing to report";
                $('#prompts').removeClass('bg-warning').addClass('bg-success');
        }}, 5000);
    }
    document.ros.Topic({ros:document.ros,
                        name:"/tosay",
                        messageType:"std_msgs/String"}).subscribe(tty);


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
