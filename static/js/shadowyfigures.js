$(document).ready(function() {
    var header = $('h1');
    var text = header.text();
    header.html('');

    // Velocity and acceleration
    var v = 1,
        a = .75;

    // Shadow's x offset, y offset, blur
    var x, y, b;
    var color = '#222';

    // Loop through each letter, wrapping it in a <span> with an accelerating
    // text-shadow
    $.each(text, function(i, c) {
        // For now, they're each equal to the current velocity
        x = y = b = v;
        var shadow = color + ' ' + x + 'px ' + y + 'px ' + b + 'px';
        header.append($('<span style="text-shadow: ' + shadow + ';">' + c + '</span>'));
        v += a;
    });
})