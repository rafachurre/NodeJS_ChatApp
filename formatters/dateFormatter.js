let formatterObject = {
    prettyDate: function(dateString){
        var d = new Date(dateString);
        var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
        var m = monthNames[d.getMonth()];
        var y = d.getFullYear();
        return d+' '+m+' '+y;
    }
}

let dateFormatter = module.exports = formatterObject;