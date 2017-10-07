//#######1#########2#########3#########4#########5#########6#########7#########8#########9#########0
const NL=String.fromCharCode(0x0a);
var C={
  setColor: function(name){
    var me=this;
    if(!me.Code[name]){name='Turquoise';}
    return {
      'back': '#'+me.Code[name][0], 'light': '#'+me.Code[name][1], 'medium': '#'+me.Code[name][2],
      'standard': '#'+me.Code[name][3], 'dark': '#'+me.Code[name][4], 'text': '#'+me.Code[name][5],
      'select': '#db07eb', 'hover': '#ebebeb', 'letter': '#2e2e2e', 'title': '#006d90'
    };
  },
//
  setFont: function(name){
    var out; switch(name){
    case 'dummy': out={}; break;
    default:
      out={
        'fontSS': '10px', 'fontS': '12px', 'fontM': '14px', 'fontL': '18px',
        'fontO': '20px', 'fontXO': '24px'
      };
    }
    return out;
  },
//
  setCancel: function(){
    var out=''; //return out;
    out+='* {'+NL;
    out+='  margin: 0; padding: 0; border: 0; font-size: 14px;'+NL;
    out+='}'+NL;
    out+='body {'+NL;
    out+='font-family: "Hiragino Kaku Gothic Pro","ヒラギノ角ゴ Pro W3","ＭＳ Ｐゴシック",Osaka,sans-serif;'+NL;
    out+='background-color: %{back}; color: %{letter};'+NL;
    out+='  display: block; overflow-x: hidden:'+NL;
    out+='}'+NL;
    out+=NL;
    out+='h1, h2 {'+NL;
    out+='font-family: "Signika", sans-serif; font-weight: 600;'+NL;
    out+='}'+NL;
    out+=NL;
    out+='h1 {'+NL;
    out+='font-size: %{fontXO}; color: %{title};'+NL;
    out+='}'+NL;
    out+=NL;
    out+='h2 {'+NL;
    out+='  font-size: %{fontL}; line-height: 33px;'+NL;
    out+='  background: %{back} url(/image/bg_h2.jpg) no-repeat top left;'+NL;
    out+='  padding-left: 12px;'+NL;
    out+='}'+NL;
    out+=''+NL;
    out+='ul {'+NL;
    out+='  list-style: none;'+NL;
    out+='}'+NL;
    out+=''+NL;
    out+='p {'+NL;
    out+='  padding: 5px 0; line-height: 18px;'+NL;
    out+='}'+NL;
    out+=''+NL;
    out+='a:link, a:visited, a:hover, a:active {'+NL;
    out+='  text-decoration: none;'+NL;
    out+='}'+NL;
    out+=''+NL;
    out+='a:-webkit-any-link {'+NL;
    out+='  color: #ffffff;  text-decoration: none;'+NL;
    out+='}'+NL;
    out+=''+NL;

    out+=NL+NL+NL+NL+NL;

    return out;
  },
//
  colorSample: function(){
    var me=this;
    var out, key, ix;

    out='<table><tbody><tr><th>COLOR NAME</th><th>back</th><th>light</th><th>medium</th>';
    out+='<th>standard</th><th>dark</th><th>text</th></tr>';
    for(key in me.Code){
      out+='<tr><td>'+key+'</td>';
      for(ix in me.Code[key]){
        out+='<td style="background-color: #'+me.Code[key][ix]+'">　　</td>';
      }
      out+='</tr>';
    }
    out+='</tbody></table>';
    return out;
  },
//
  Code: {
    'Ruby': ['f5d2db', 'eba4b8', 'cc1c4d', '9e032e', '7a0222', 'ffffff'],
    'Fire engine': ['facdd0', 'eda4a7', 'ce2029', '9e030b', '73040b', 'ffffff'],
    'Burgundy': ['ead0d2', 'd4a0a4', '94121c', '6e060d', '4a090e', 'ffffff'],
    'Brick red': ['f4ded6', 'e3ad99', 'a32a00', '891700', '611000', 'ffffff'],
    'Vermillion': ['e6d1cf', 'cca29f', 'e34234', 'ad2416', '80170e', 'ffffff'],
    'Red': ['ffd4cc', 'ffa899', 'ff2600', 'bf1d00', '801300', 'ffffff'],
    'Carmine': ['f2ccd4', 'e599aa', 'ff0038', 'bf002a', '80001c', 'ffffff'],
    'Orange red': ['fadaca', 'f0b092', 'ff4e00', 'c72b00', '802700', 'ffffff'],
    'Dark orange': ['faded0', 'f6bea0', 'e85c12', 'b53300', '802200', 'ffffff'],
    'Pumkin': ['ffe3d1', 'ffc8a3', 'ff7518', 'aa3e00', 'b13e1e', 'ffffff'],
    'Orange': ['ffecd6', 'ffcf99', 'ff8f00', 'f26c0d', 'aa3e00', 'ffffff'],
    'Orange peel': ['ffeccc', 'ffd999', 'ff9f00', 'f27500', 'c75000', 'ffffff'],
    'Coral': ['ffe6db', 'ffcdb6', 'ff8249', 'f06937', '993b17', 'ffffff'],
    'Terracota': ['f7e7e0', 'ecc3b2', 'd06a3e', 'b55632', '823113', 'ffffff'],
    'Brown': ['eadbcc', 'd5b799', '964b00', '713a00', '553000', 'ffffff'],
    'Chocolate': ['ebdfd9', 'ccaba1', '703422', '521c13', '4a140b', 'ffffff'],
    'Sienna': ['e8d7cf', 'd1afa0', '8c3611', '69270d', '461a09', 'ffffff'],
    'Dark coffee': ['e0d7d4', 'c1afa8', '633826', '4f1a03', '361305', 'ffffff'],
    'Sepia': ['e3d9cf', 'c7b39f', '73420e', '593000', '402200', 'ffffff'],
    'Umber': ['eae0d9', 'd5c2b3', '956642', '704d32', '4b3321', 'ffffff'],
    'Tans': ['f3e8df', 'e6d2bf', 'c18e60', '996a3d', '73502e', 'ffffff'],
    'Bronze': ['f6e5d4', 'edcca9', 'd27f29', 'a65c11', '693906', 'ffffff'],
    'Amber': ['fef3d7', 'fce19b', 'ffb300', 'ed7710', '9b4200', '693906'],
    'Gold': ['fff9d6', 'fff099', 'ffd900', 'ffa400', 'e68e15', '693906'],
    'Sunglow': ['fffae9', 'ffeaa5', 'ffca1d', 'f5a71c', 'e68e15', '7a4608'],
    'Lemon': ['fffdcc', 'fffa99', 'fff300', 'ffd400', 'e3ac00', 'a75400'],
    'Pear': ['f6f8d1', 'eef2a4', 'd4de1b', 'b5bf07', '8f9601', '828a16'],
    'Lime': ['eafdcf', 'cbfa87', 'c1f900', '9fde23', '7fb900', '156615'],
    'Chlorophyle': ['ebf4d3', 'd7e9a8', '9cc925', '7ba60d', '5d8005', '49811f'],
    'Foliage': ['e2e8d1', 'c4d1a4', '6c8b1b', '57730e', '3e5404', 'ffffff'],
    'Olive': ['e4eacb', 'd6dfb2', '697800', '4a5200', '2f3600', 'ffffff'],
    'Army': ['dbdcd2', 'b7baa5', '515918', '343b04', '26290f', 'ffffff'],
    'Grass': ['ebfcdf', 'c2f79e', '5ba825', '377d00', '00570a', 'ffffff'],
    'Kelly green': ['dbf1cc', 'b6e299', '49b700', '378900', '255c00', 'ffffff'],
    'Forest': ['d2e7d2', 'a4cfa4', '1c881c', '156615', '0e440e', 'ffffff'],
    'Green': ['cce5d8', '99cbb2', '007e3e', '005b2a', '004420', 'ffffff'],
    'Emerald': ['cceae4', '99d6c8', '009876', '007259', '004c3b', 'ffffff'],
    'Turquoise': ['d6f3f0', '99e1da', '00b3a2', '009488', '005b5a', 'ffffff'],
    'Teal': ['deebee', 'adced4', '338594', '006779', '004d5b', 'ffffff'],
    'Cold blue': ['cceaf1', '99d5e2', '0095b7', '007089', '004b5c', 'ffffff'],
    'Cyaan': ['cceffc', '99dff9', '00aeef', '0090bf', '006d90', 'ffffff'],
    'Aquamarine': ['d3f6fd', 'a6edfc', '21d1f7', '00a2d9', '0079a8', 'ffffff'],
    'Ice': ['f8fdff', 'f1faff', 'dbf3ff', 'a8e3ff', '71c2eb', '25679d'],
    'Peace': ['d7eaf8', 'afd4f1', '3794dd', '136db5', '0b5794', 'ffffff'],
    'Denim': ['cce0f2', '99c1e5', '0064bf', '004f96', '003b71', 'ffffff'],
    'Steel blue': ['d7e6f0', 'b0cde2', '3983b6', '246594', '154b70', 'ffffff'],
    'Azure': ['cce7ff', '99ceff', '0085ff', '0064bf', '004b8f', 'ffffff'],
    'Royal blue': ['d4e2f9', 'a9c6f4', '2870e3', '1e54aa', '143872', 'ffffff'],
    'Navy blue': ['ccd5e5', '99aacb', '003494', '00205d', '00163e', 'ffffff'],
    'Indigo': ['dad1e6', 'b6a3ce', '481884', '33036e', '270059', 'ffffff'],
    'Violet': ['e5d4eb', 'cba9d7', '7c279b', '5d1d74', '3e144e', 'ffffff'],
    'Fuschia': ['f5d8e9', 'ebb1d3', 'ce3c92', 'ab156d', '8f0758', 'ffffff'],
    'Carnation pink': ['ffeef4', 'ffdde9', 'ffaac9', 'cc7695', '9c546f', 'ffffff'],
    'Salmon': ['ffeaed', 'ffd5da', 'ff95a3', 'd9737f', 'a65059', 'ffffff'],
    'French rose': ['fedde7', 'fdbbd0', 'fb5589', 'c43b67', 'a11d47', 'ffffff'],
    'Pink': ['fee5ef', 'ffd3df', 'f42376', 'd02261', 'a8025b', 'ffffff'],
    'Magenta': ['ffd6e9', 'ffacd2', 'ff308f', 'bf246b', '801848', 'ffffff'],
    'Cerise': ['f9d8df', 'f4b2c0', 'e33e61', 'b3213e', '86192f', 'ffffff']
  },
  close: {}
};
module.exports=C;
