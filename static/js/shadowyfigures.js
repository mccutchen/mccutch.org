$(document).ready(function() {
    var spans = $('h1>span');

    // Velocity and acceleration
    var v = 1,
        a = 1;

    // Shadow's x offset, y offset, blur
    var x, y, b;
    var color = '#222';

    // Rotation in degrees
    var d = 0;

    // Loop through each span, gathering its text up and then clearing it out
    // in preparation for replacement by the same text with shadows applied.
    spans.each(function(i, span) {
        span = $(span);
        var text = span.text();
        span.html('');

        // Loop through each letter, wrapping it in a <span> with an
        // accelerating text-shadow
        $.each(text, function(i, c) {
            // For now, they're each equal to the current velocity
            x = y = b = v;
            d = v/2;
            var styles = {
                'text-shadow': color + ' ' + x + 'px ' + y + 'px ' + b + 'px',
                '-webkit-transform': 'rotate(' + d + 'deg)',
                '-moz-transform': 'rotate(' + d + 'deg)'
            }
            span.append($('<span>' + c + '</span>').css(styles));
            v += a;
        });
    });
})