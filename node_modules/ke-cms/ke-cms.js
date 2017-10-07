'use strict';
const Utility=require('ke-utility');
const CLR=require('./ke-color.js');
const Fs=require('fs');
const Http=require('http');
const Url=require('url');
const Cheerio=require('cheerio');
const NL=String.fromCharCode(0x0a);

module.exports = class Cms extends Utility {
/**
 * オブジェクトコンストラクション
 * @return {Void}    none
 * @constructor
 */
  constructor() {
    super();
    this.CON={}; this.SS={};
  }
  /**
 * サーバー起動
 * @param  {Function} fn RESTインターフェイス処理
 * @param  {Object}   op 起動オプション
 * @return {Void}        none
 * @method
 */
  server(fn, op) {
    let me=this;
    this.setting(op);
    op.port=process.env.PORT||op.port||me.CFG.port||'8080';
    let l=me.CFG.current.search(/nodejs/);
    me.checkDir(['data', 'local'], me.CFG.current.substr(0, l));
    if(me.argv(0)){
      me.CON.today=me.argv(0); me.infoLog('日付変更しました。date=' + me.CON.today);
      me.CON.timesift=true;
    }else{
      me.CON.today=me.today('Y/M/D'); me.CON.timesift=false;
    }
    me.menuBuild(op);
    //
    me.Server=Http.createServer((req, res)=> {
      let error=true;
      me.menuBuild(op);
      me.sessionIn(req, res, op);
      me.analyzeRequest(req, res);
      switch(me.SS.PATH[1]){
      case 'rest':
        error=fn(me.SS, me);
        if(!error){me.sessionOut(req, res);}
        break;
      case 'image': error=me.putFile(res, op.base+'/image/'); break;
      case 'js': error=me.putFile(res, op.base+'/js/'); break;
      case 'json': error=me.putFile(res, op.base+'/json/'); break;
      case 'css': error=me.putExpand(res, op.base+'/css/'); break;
      case 'ext': error=me.putFile(res, op.base+'/ext/'); break;
      case 'src': error=me.putFile(res, op.base+'/src/'); break;
      case 'cms': error=me.putFile(res, op.base+'/cms/'); break;
      case 'frame': error=me.putFile(res, op.base+'/frame/'); break;
      case 'config': error=me.sendConfig(res); break;
      case 'repository': error=me.putFile(res, op.current+'/repository/'); break;
      case 'source': error=me.putEscape(res, op.base+'/source/'); break;
      case 'favicon.ico': error=me.putFile(res, op.base+'/image/'); break;
      case 'sitemap.xml': error=me.sitemap(res); break;
      case 'reload': me.menuBuild(op, true); error=false;
        res.writeHead(200, {'Content-Type': 'text/plane', 'charset': 'utf-8'}); res.end('OK');
        break;
      default:
        if(me.SS.GET.setdate){me.debugSetdate(res, op);}
        me.putHtml(me.SS.URI.pathname, op.base, res); me.SS.INFOJ=me.INFOJ;
        try{
          Fs.writeFileSync(op.data+'/ss_'+me.SS.cid+'.json', JSON.stringify(me.SS), 'utf8');
        }catch(e){
          me.sevierLog('Session File Write Error', e);
          me.infoLog('data', me.SS);
        }
      }
      //
    }).listen(op.port);
    me.infoLog('サーバーが開始しました。 port:' + op.port);
  }
  /**
 * 実行オプションのセット（省略値解釈）
 * @param  {Object} op オプションオブジェクト
 * @return {Object}    編集後オプションオブジェクト
 * @method
 */
  setting(op) {
    op=op||{}; for(let k in op){this.CFG[k]=op[k];}
    this.info(op.group);
    op.starter=op.starter||'index.html';
    op.template=op.template||'Template1.frm';
    let l=this.CFG.current.search(/nodejs/);
    console.log(l, this.CFG.current);
    if(l<0){op.current=op.current||this.CFG.current;}
    else{op.current=op.current||this.CFG.current.substr(0, l-1);}
    op.base=op.base||op.current+'/html';
    op.data=op.data||op.current+'/data';
    op.local=op.local||op.current+'/local';
    return op;
  }
  /**
 * セッションイン時の処理・クッキー情報など
 * @param  {Object} req http request インターフェイス
 * @param  {Object} res http response インターフェイス
 * @param  {Object} op  実行オプション
 * @return {Void}      none
 * @method
 */
  sessionIn(req, res, op) {
    let me=this, wk={};

    wk.cookies=me.getCookies(req);

    wk.cid=me.valCookies('cid');
    if(!wk.cid){
      wk.cid=Math.floor(Math.random()*100000000);
    }

    wk.token=Math.floor(Math.random()*100000000)+'/'+Math.floor(Math.random()*10000000);
    me.setCookies('cid', wk.cid); me.setCookies('token', wk.token);

    try{
      me.SS=JSON.parse(Fs.readFileSync(op.data+'/ss_'+wk.cid+'.json', 'utf8'));
      me.SS.cookies=wk.cookies;
    }catch(e){
      me.SS={};
    }
    me.SS.cid=wk.cid; me.SS.token=wk.token;
  }
  /**
 * リクエストストリング（URI)の解析・分解
 * @param  {Object} req httpリクエストインターフェイス
 * @return {Void]}      none
 * @method
 */
  analyzeRequest(req) {
    let me=this;
    me.SS.URI=Url.parse(req.url);
    me.SS.PATH=me.SS.URI.pathname.split('/');
    me.SS.method=req.method; me.SS.headers=req.headers;
    me.SS.POST={}; me.SS.GET={};
    if(req.method=='POST'){
      let body = '';
      let wid=me.ready();
      req.on('data', function(data){body+=data;});
      req.on('end', function(){me.SS.POST=JSON.parse(body); me.post(wid);});
      me.wait();
    }
    if(me.SS.URI.query){
      let a=me.SS.URI.query.split('&');
      let b, i; for(i in a){b=a[i].split('='); me.SS.GET[b[0]]=b[1];}
    }
    //
    if(me.SS.PATH[1]=='cms'){me.SS.Apli=me.SS.PATH[2];}
  }
  /**
 * ウッキー情報の取り出し
 * @param  {Object} req http リクエストインターフェイス
 * @return {Array}      クッキーストリング配列
 * @method
 */
  getCookies(req) {
    let me=this; let key, value, i, x, y, f, out={};

    me.SS.cookies=[]; x=req.headers.cookie; key=''; value=''; f=0;

    if(x){
      for(i=0; i<x.length; i++){
        y=x.charAt(i);
        switch(y){
        case ' ': break;
        case ';': out[key]=value; key=''; value=''; f=0; break;
        case '=': f=1; break;
        default: if(f==0){key+=y;}else{value+=y;}
        }
      }
      if(key){out[key]=value;}
    }
    me.SS.cookies=out;
    return out;
  }
  /**
 * クッキーインタフェイスへのセット
 * @param  {String} key   クッキーキー
 * @param  {String} value クッキー値
 * @method
 */
  setCookies(key, value) {
    this.SS.cookies[key]=value;
  }
  /**
 * クッキー血の参照
 * @param  {String} key クッキーキー
 * @return {String}     参照値
 * @method
 */
  valCookies(key) {
    return this.SS.cookies[key];
  }
  /**
 * 出力用クッキーストリングの編集
 * @return {String} 出力用クッキーストリング
 * @method
 */
  putCookies() {
    let me=this; let out=[], x, i, j;

    i=0; for(j in me.SS.cookies){
      x='';
      x+=j+'='+me.SS.cookies[j]+';';
      x+='path=/;';
      x+='expires=;';
      out[i]=x;
      i++;
    }
    return out;
  }
  /**
 * コンテンツタイプを拡張子から編集
 * @param  {String} mdf 拡張子
 * @return {String}     コンテンツタイプ
 * @method
 */
  ctype(mdf) {
    return {
      'html': 'text/html', 'css': 'text/css', 'js': 'text/javascript', 'txt': 'text/plane',
      'xml': 'text/xml',
      'png': 'image/png', 'gif': 'image/gif', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
      'ico': 'image/x-icon'
    }[mdf]||'plain/text';
  }
  /**
 * 単純なファイル転送手続き
 * @param  {Object} res  httpレスポンスインターフェイス
 * @param  {Steing} base 基準フォルダ
 * @return {Void}        none
 * @method
 */
  putFile(res, base) {
    let me=this; let i=0, path='', c='';
    for(i=2; i<me.SS.PATH.length; i++){
      path+=c+me.SS.PATH[i]; c='/';
    }
    Fs.readFile(base+path, function(err, data){
      if(err){
        me.infoLog('putFile 404:'+base+path);
        res.writeHead(404, 'NOT FOUND', {'content-type': 'text/html'});
        res.end();
      }else{
        res.writeHead(200, {
          'Content-Type': me.ctype(me.modifier(base+path)), 'charset': 'utf-8'
        });
        res.end(data);
      }
    });
  }
  /**
 * パラメータ展開による出力（CSSなど）
 * @param  {Object} res  httpレスポンスインターフェイス
 * @param  {string} base 基本ホルダ
 * @return {Void}        none
 * @method
 */
  putExpand(res, base) {
    let me=this, path=me.SS.PATH[me.SS.PATH.length-1];
    let bcolor=me.INFOJ.Basecolor||'Ruby';
    let dt=CLR.setColor(bcolor);
    let d=CLR.setFont(''); let i; for(i in d){dt[i]=d[i];}
    let txt;
    if(me.isExist(base+path)){
      txt=Fs.readFileSync(base+path, {encoding: 'utf-8'});
    }else{
      txt='"File Not Found:"'+base+path; me.infoLog(txt);
    }
    res.writeHead(200, {
      'Content-Type': me.ctype(me.modifier(base+path)), 'charset': 'utf-8'
    });
    res.end(me.parm(txt, dt), 'utf8');
  }
  /**
 * ソースデータ用の「<>」などのエスケープ出力
 * @param  {Object} res  httpレスポンスインターフェイス
 * @param  {String} base 基本フォルダ
 * @return {Void}        none
 * @method
 */
  putEscape(res, base) {
    let me=this, path=me.SS.PATH[me.SS.PATH.length-1];

    try{
      let txt=Fs.readFileSync(base+path, {encoding: 'utf-8'});
      res.writeHead(200, {
        'Content-Type': 'text/html', 'charset': 'utf-8'
      });
      res.end(me.escape(txt, true), 'utf8');
    }catch(e){
      me.errorLog('putEscape Read File', e);
      res.writeHead(404, {'Content-Type':  'text/html', 'charset': 'utf-8'});
      res.end('');
    }
  }
  /**
 * コンフィグ情報（INFOJ）を送信
 * @param  {Object} res httpレスポンスインターフェイス
 * @return {Void}       none
 * @method
 */
  sendConfig (res){
    let me=this; let a, i, data, con={};
    for(i in me.SS.INFOJ){
      if(i.search(/./)>0){
        a=i.split('.'); if(!con[a[0]]){con[a[0]]={};} con[a[0]][a[1]]=me.INFOJ[i];
      }else{
        con[i]=me.INFOJ[i];
      }
    }
    try{
      data=JSON.stringify(me.INFOJ);
    }catch(e){
      res.writeHead(404, {'Content-Type':  'text/plane', 'charset': 'utf-8'});
      res.end('404 NOT FOUND');
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/plane', 'charset': 'utf-8'
    });
    res.end(data);
  }
  /**
 * タイムシフト再生
 * @param  {Object} res httpレスポンスオブジェクト
 * @param  {Object} op  実行オプション
 * @return {Void}       none
 * @method
 */
  debugSetdate(res, op) {
    let me=this; let date;
    if(me.CFG.mode=='debug'){
      date=me.repby(me.SS.GET.setdate, '.', '/');
      me.CON.today=date; me.CON.timesift=true; me.CON.menuBuild='';
      me.menuBuild(op);
    }
  }
  /**
 * 通常のCMS展開出力
 * @param  {String} url  指定URL
 * @param  {string} base 基本フォルダ
 * @param  {Object} res  httpレスポンスオブジェクト
 * @return {Void}        none
 * @method
 */
  putHtml(url, base, res) {
    let me=this; let code=200;
    let b=url.split('/'); if(b[b.length-1]==''){url=url+'index.html';}
    let a=url.split('.'); let n;
    if(!a[1]){
      a[0]+='/index'; a[1]='html'; url+='/index.html'; n=me.SS.PATH.length; me.SS.PATH[n]='';
    }else if(a[1]!='html'){
      res.writeHead(404, {'Content-Type':  'text/html', 'charset': 'utf-8'});
      res.end('ERROR 404');
    }

    let dt={}, txt; dt.PARM='';
    try{
      if(!me.getInfoj(base)){
        res.writeHead(404, {'Content-Type':  'text/html', 'charset': 'utf-8'});
        res.end('ERROR putHTML');
        me.errorLog('GET CONFIG FILE:'+me.error);
        return;
      }else{
        if(!me.isExist(base+url)){
          a[a.length-1]='page'; let i, c='', u=''; for(i in a){u=u+c+a[i]; c='.';}
          dt=me.pageinfo(base+u, base);
          if(!dt.BODY){dt=me.pageinfo(base+'/error404.page', base); code=404;}
          me.layer(dt.PARM.split(NL));

          me.INFOJ.url=url;
          me.INFOJ.Short=me.INFOJ.Short||me.INFOJ.Title;
          me.CSS=dt.CSS||'';
          me.toolbox();

          if(me.isExist(base+'/template/'+me.INFOJ.Template+'.htm')){
            txt=Fs.readFileSync(base+'/template/'+me.INFOJ.Template+'.htm', {encoding: 'utf8'});
          }else{
            txt='Template Not Found:'+base+'/template/'+me.INFOJ.Template+'.htm';
            me.infoLog(txt);
          }
        }else{
          if(me.isExist(base+url)){
            txt=Fs.readFileSync(base+url, {encoding: 'utf-8'});
          }else{
            txt='File Not Found:'+base+url; me.infoLog(txt);
          }
        }
      }
      res.writeHead(code, {
        'Content-Type': 'text/html', 'charset': 'utf8', 'Set-Cookie': me.putCookies()
      });
      res.end(me.expand(txt, base, dt), 'utf8');
    }catch(e){
      me.sevierLog('putHtml', e);
      res.writeHead(404, {'Content-Type':  'text/html', 'charset': 'utf-8'});
      res.end('');
    }
  }
  /**
 * INFOJテーブルを作成
 * @param  {String} base 基本フォルダ
 * @return {Void}        none
 * @method
 */
  getInfoj(base) {
    let me=this; let a, f, k, i, j, d, r, l; let fn='index.cfg', path=me.SS.PATH;

    me.INFOJ=me.INFOJ||{}; me.INFOJ.base=base;
    l=path.length; if(l>2){me.INFOJ.Group=path[2];}else{me.INFOJ.Group='home';}
    if(path[l-1].search(/#/)>-1){me.INFOJ.level=l-1;}else{me.INFOJ.level=l-2;}
    for(i in path){
      if(i>0){
        try{
          r=me.getFs(base+fn); d=JSON.parse(r);
          for(j in d){
            f=true; if(d[j].CmsVersion){a=d[j].CmsVersion.split('-'); f=me.validation(a[1]);}
            if(f){for(k in d[j]){me.INFOJ[k]=d[j][k];}}
          }
        }catch(e){
          me.infoLog('getInfoj can\'t get file='+base+fn, e);
        }
      }
      fn='/'+path[i]+fn;
    }
    me.INFOJ.loaded='yes';
    return me.INFOJ.CmsVersion;
  }
  /**
 * ページ定義ファイルの読み込み
 * @param  {String} fname ファイル名
 * @param  {String} base  基本フォルダ
 * @return {Void}         none
 * @method
 */
  pageinfo(fname, base) {
    let me=this;

    if(!me.isExist(fname)){fname=base+'/error404.page';} let d=me.getText(fname, true);

    let f={}, k='BODY';
    f.PARM=''; f.BODY=''; f.HISTORY=''; f.CSS='';

    if(d){
      if(d[0]){if(d[0].charCodeAt(0)==65279){d[0]=d[0].substr(1);}} // bom除去feff
      if(d[0]){if(d[0].charCodeAt(0)==65534){d[0]=d[0].substr(1);}} // bom除去fffe
      let a; for(let i in d){
        a=me.unstring(d[i]); a[1]=a[1]||'';
        if(a[0].charAt(0)=='-'){
          k=a[0].substr(1); if(!me.validation(a[1])){k='';}
        }else{
          if(k!=''){
            f[k]+=d[i]+NL;
          }
        }
      }

      return f;
    }else{
      me.errorLog('pageinfo nothing');
      return {};
    }
  }
  /**
 * 階層化対応
 * @param  {Array} lines 階層データ
 * @return {Void}       none
 * @method
 */
  layer(lines) {
    let me=this;

    let i, v, g;
    g=''; for(i in lines){
      v=me.unstring(lines[i]);
      if(v[1]=='*'){
        g=v[0];
      }else{
        if(g){
          me.INFOJ[g+'.'+v[0]]=v[1];
        }else{
          if(v[0]){me.INFOJ[v[0]]=v[1];}
        }
      }
    }

  }
  /**
 * HTMLへの挿入と展開
 * @param  {String} buf  バッファデータ
 * @param  {String} base 基本フォルダ
 * @param  {Object} dt   展開用変数データ
 * @return {String}      HTML文
 * @method
 */
  expand(buf, base, dt) {
    let me=this; let txt=me.parm(buf);
    let $=Cheerio.load(txt, {
      normalizeWhitespace: true,
      xmlMode: true
    });

    $=me.devCss($); $=me.devPage($, dt); $=me.devInclude($);
    $=me.devParts($); $=me.devFrame($); $=me.devBlock($);
    if(me.CFG.mode=='debug'){$=me.debugInfo($);}
    if(me.INFOJ.Use=='responsive'){$=me.appendScript($, 'responsive');}
    return $.html();

  }
  /**
 * スクリプトタグの追加（Jquery,Google,responsive）
 * @param  {Object} $ Jqueryオブジェクト
 * @return {Object}   編集後オブジェクト
 * @method
 */
  appendScript($) {
    let me=this;
    if(!me.INFOJ.Analytics){return $;}

    $('body').append('<script type="text/javascript" '+
      'src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js"> </script>');
    $('body').append('<script type="text/javascript" src="/repository/responsive.js"> </script>');
    $('body').append('<script language="javascript">RES.begin({loadConfig: "yes"});</script>');

    if(me.INFOJ.Analytics.account){
      let x='<script> \n';
      x+='(function(i,s,o,g,r,a,m){i[\'GoogleAnalyticsObject\']=r;i[r]=i[r]||function(){';
      x+='(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),';
      x+='m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)';
      x+='})(window,document,\'script\',\'//www.google-analytics.com/analytics.js\',\'ga\');';
      x+='ga(\'create\', \''+me.INFOJ.Analytics.account+'\', \'auto\');';
      x+='ga(\'send\', \'pageview\');';
      x+='</script>';
      $('head').append(x);
    }

    return $;

  }
  /**
 * Attr[cms-page]を展開
 * @param  {Object} $  Jqueryオブジェクト
 * @param  {Object} dt 展開変数
 * @return {Object}    編集後オブジェクト
 * @method
 */
  devPage($, dt) {
    let me=this, f, txt;
    $('[cms-page]').each(function(){
      f=$(this).attr('cms-page');
      txt=me.parm(dt[f]);
      $(this).html(me.escape(txt));
    });
    return $;
  }
  /**
 * HTML文字をエスケープ
 * @param  {String} x      対象文字列
 * @param  {Boolean} force 奇数、偶数行クラスを編集するtrue/false
 * @return {String}        結果文字列
 * @method
 */
  escape(x, force) {
    force=force||false; let l0, l1;
    if(force){l0='<p class="odd">'; l1='<p class="even">';}else{l0='<p>'; l1='<p>';}

    let a=x.split(NL), i, j, y, out='', f=force; if(f){out+='<p>';}
    let g=true; for(i in a){
      if(a[i].search(/\[escape\]/)>-1){f=true; if(g){out+=l0;}else{out+=l1;}}
      else if(a[i].search(/\[epacse\]/)>-1){f=false; out+='</p>';}
      else{
        if(f){
          y=a[i];
          if(y.length==0){
            out+='&nbsp;</p>'+NL;  if(g){out+=l0;}else{out+=l1;}
          }else{
            for(j=0; j<y.length; j++){
              switch(y.charAt(j)){
              case '<': out+='&lt;'; break;
              case '>': out+='&gt;'; break;
              case '&': out+='&amp;'; break;
              case ' ': out+='&nbsp;'; break;
              default: out+=y.charAt(j, 1);
              }
            }
            out+='&nbsp;</p>'+NL; if(g){out+=l0;}else{out+=l1;}
          }
        }else{
          out+=a[i]+NL;
        }
      }
      if(g){g=false;}else{g=true;}
    }
    if(f){out+='&nbsp;</p>'+NL;}
    return out;
  }
  /**
 * Attr[cms-include]を展開
 * @param  {Object} $ Jqueryオブジェクト
 * @return {Object}   展開結果オブジェクト
 * @method
 */
  devInclude($) {
    let me=this, f, txt;
    $('[cms-include]').each(function(){
      f=$(this).attr('cms-include');
      try{
        f='./parts/'+f+'.htm';
        txt=me.parm(Fs.readFileSync(f).toString());
      }catch(e){txt='NOT FOUND:'+f;}
      $(this).html(txt);
    });
    return $;

  }
  /**
 * Attr[cms-parts]を展開
 * @param  {Object} $ Jqueryオブジェクト
 * @return {Object}   展開結果オブジェクト
 * @method
 */
  devParts($) {
    let me=this, f, txt;

    $('[cms-parts]').each(function(){
      f=$(this).attr('cms-parts');
      switch(f){
      case 'navbar': txt=me.navbar(); break;
      case 'guide': txt=me.guide(); break;
      case 'menu': txt=me.menu(); break;
      case 'sidemenu': txt=me.sidemenu(); break;
      case 'foot': txt=me.foot(); break;
      case 'history': txt=me.history(); break;
      case 'color': txt=me.color(); break;
      case 'pankuzu': txt=me.pankuzu(); break;
      default : txt='[Not Found]'+f;
      }
      $(this).html(txt);
    });
    return $;
  }
  /**
 * Attr[cms-frame]を展開
 * @param  {Object} $ 編集対象Jqueryオブジェクト
 * @return {Object}   展開後結果オブジェクト
 * @method
 */
  devFrame($) {
    let me=this;
    let data, frame, dname, txt, base;

    base=me.INFOJ.base;
    $('[cms-frame]').each(function(){
      frame=$(this).attr('cms-frame'); dname=$(this).attr('source');
      if(dname){
        try{
          dname=me.parm(base+'/json/'+dname+'.json'); data=me.getJson(dname);
        }catch(e){
          txt='<p>NOT FOUND:'+dname+'</p>';
        }
      }
      if(!txt){txt=me.develop(base+'/template/'+frame+'.frm', data);}
      if(!txt){txt='<p>'+me.error+'</p>';}
      $(this).html(txt);
    });
    return $;
  }
  /**
 * Attr[cms-block]を展開
 * @param  {Object} $ 対象Jqueryオブジェクト
 * @return {Object}   展開後オブジェクト
 * @method
 */
  devBlock($) {
    let me=this, m, txt;

    $('[cms-block]').each(function(){
      m=$(this).attr('cms-block');
      if(me.BLOCK[m]){txt=me.parm(me.BLOCK[m]);}else{txt='<p>NOT FOUND:'+m+'</p>';}
      $(this).html(txt);
    });
    return $;
  }
  /**
 * Attr[cms-css]を展開
 * @param  {Object} $ 対象Jqueryオブジェクト
 * @return {Object}   展開結果オブジェクト
 * @method
 */
  devCss($) {
    let me=this;
    $('[cms-css]').each(function(){
      if(me.CSS){$(this).html(me.parm(me.CSS));}
    });
    return $;
  }
  /**
   * デバッグ情報をページに追加
   * @parm   {Object} $ 展開対象Jqueryオブジェクト
   * @return {Object}   展開結果オブジェクト
   */
  debugInfo($) {
    let me=this;

    let ix, x='<div style="display: none; position: absolute; top: -5000px;">';

    x+=NL+'INFOJ'; for(ix in me.INFOJ){x+=NL+'<p>'+ix+'='+me.INFOJ[ix]+'</p>';}
    x+=NL+'CFG'; for(ix in me.CFG){x+=NL+'<p>'+ix+'='+me.CFG[ix]+'</p>';}

    x+='</div>'; $('body').append(x); return $;
  }
  /**
 * パンくずパーツ生成
 * @return {String} パンくずパーツHTML
 * @method
 */
  pankuzu() {
    let me=this; let out, mem, base, mark, dt=[], j;
    mem=me.INFOJ.pankuzu_form||'pankuzu'; mark=me.INFOJ.pankuzu_mark||' &gt; ';
    base=me.INFOJ.base;
    dt[0]={}; dt[0].url='/index.html'; dt[0].Title=me.MENU[0].short;
    if(me.SS.PATH.length==2){if(me.SS.PATH[1]!='' && me.SS.PATH[1]!='index.html'){
      dt[1]={}; dt[1].url='/'+me.SS.PATH[1];
      for(j in me.MENU){if(me.MENU[j].url==dt[1].url){dt[1].title=me.MENU[j].title;}}
    }}
    if(me.SS.PATH.length==3){
      if(me.SS.PATH[2]!='' && me.SS.PATH[1]!='index.html'){
        dt[1]={}; dt[1].url='/'+me.SS.PATH[1]+'/index.html';
        for(j in me.MENU){if(me.MENU[j].url==dt[1].url){dt[1].title=mark+me.MENU[j].short;}}
        dt[2]={}; dt[2].url='/'+me.SS.PATH[1]+'/'+me.SS.PATH[2];
        for(j in me.MENU){if(me.MENU[j].url==dt[2].url){dt[2].title=mark+me.MENU[j].title;}}
      }else{
        dt[1]={}; dt[1].url='/'+me.SS.PATH[1]+'/index.html';
        for(j in me.MENU){if(me.MENU[j].url==dt[1].url){dt[1].title=mark+me.MENU[j].short;}}
        dt[2]={}; dt[2].url='/'+me.SS.PATH[1]+'/index.html';
        for(j in me.MENU){if(me.MENU[j].url==dt[2].url){dt[1].title=mark+me.MENU[j].title;}}
      }
    }
    out=me.develop(base+'/template/'+mem+'.frm', dt);
    return out;

  }
  /**
 * ナビゲーションパーツ生成
 * @return {String} ナビゲーションパーツHTMLテキスト
 * @method
 */
  navbar() {
    let me=this;
    let out='', mem, base, dt, ix;

    base=me.INFOJ.base; mem=me.INFOJ.navbar_form||'menu1';
    dt=me.selection('top');
    for(ix in dt){if(dt[ix].group==me.SS.PATH[1]){dt[ix].now='now';}else{dt[ix].now='';}}
    if(me.SS.PATH.length==2){dt[0].now='now';}

    out=me.develop(base+'/template/'+mem+'.frm', dt);
    return out;
  }
  /**
 * サイドメニューパーツ生成
 * @return {String} サイドメニューHTMLテキスト
 * @method
 */
  sidemenu() {
    let me=this, out='', base=me.INFO.base;
    let mem=me.INFOJ.sidemenu_form||'menu2';

    //    let dt=me.getJson(base+'/template/'+data+'.json');
    let dt=me.selection('side');
    out=me.develop2(base+'/template/'+mem+'.frm', dt);

    return out;
  }
  /**
   * フッターパーツ
   * @return {String} フッター用HTMLストリング
   * @method
   */
  foot() {
    let me=this, out='', base=me.INFOJ.base;
    let mem=me.INFOJ.foot_form||'footer1';

    //   let dt=me.getJson(base+'/template/'+data+'.json');
    let dt=me.selection('top2');
    let ix; for(ix in dt){
      if(dt[ix].url==me.INFOJ.url){dt[ix].now='now';}else{dt[ix].now='';}
    }
    out=me.develop2(base+'/template/'+mem+'.frm', dt, 'top2');

    return out;
  }
  /**
 * ページ内ガードパーツ生成
 * @return {String} 結果HTMLテキスト
 * @method
 */
  guide() {
    let me=this, out='', base=me.INFOJ.base;
    let mem=me.INFOJ.guide_form||'menu3';

    //    let dt=me.getJson(base+'/template/'+data+'.json');
    let a=me.INFOJ.url.split('#');
    let dt=me.selection('section', a[0]);
    out=me.develop(base+'/template/'+mem+'.frm', dt);

    return out;
  }
  /**
 * グループ内メニューパーツ生成
 * @return {string} 結果HTMLテキスト
 * @method
 */
  menu() {
    let me=this, out='', base=me.INFOJ.base;
    let mem=me.INFOJ.navbar_form||'menu4';

    //    let dt=me.getJson(base+'/template/'+data+'.json');
    let dt=me.selection('sibling', me.INFOJ.Group);
    out=me.develop(base+'/template/'+mem+'.frm', dt);

    return out;
  }
  /**
 * 更新履歴パーツ生成
 * @return {string} 結果HTMLテキスト
 * @method
 */
  history() {
    let me=this;
    let data, frame, dname, txt, base, ix, dt, date;

    base=me.INFOJ.base;
    frame=me.INFOJ.History_frame||'history';
    dname=me.INFOJ.History_source||'history';
    if(me.CON.timesift){date=me.CON.today;}else{date=me.today('Y/M/D');}

    if(me.INFOJ.History=='auto'){dt=me.HISTORY;}
    else{
      try{
        dname=me.parm(base+'/json/'+dname+'.json'); dt=me.getJson(dname);
      }catch(e){
        txt='<p>NOT FOUND:'+dname+'</p>';
      }
    }
    data=[]; for(ix in dt){if(dt[ix].date){if(dt[ix].date<=date){data[ix]=dt[ix];}}}
    if(!txt){txt=me.develop(base+'/template/'+frame+'.frm', data);}
    if(!txt){txt='<p>'+me.error+'</p>';}
    return txt;
  }
  /**
 * ２段階構造展開パーツ生成
 * @param  {String}  fname テンプレートファイル名
 * @param  {Object}  dt    変数テーブル
 * @param  {String}  tp    タイプside/top2
 * @param  {Integer} ix    データインデックス
 * @return {String}        生成結果HTMLテキスト
 * @method
 */
  develop2(fname, dt, tp, ix) {
    let me=this; if(!dt){dt=me.REC;} if(!ix){ix=0;} tp=tp||'top2';
    let d=me.getText(fname, true);
    let f={}; f['-HEAD']=''; f['-BHEAD']=''; f['-BODY']=''; f['-BFOOT']=''; f['-FOOT']='';
    let k='-BODY'; let out='';
    if(d){
      if(d[0]){
        if(d[0].charCodeAt(0)==65279){d[0]=d[0].substr(1);} // bom除去feff
        if(d[0].charCodeAt(0)==65534){d[0]=d[0].substr(1);} // bom除去fffe
      }
      for(let i in d){
        switch(d[i]){
        case '-HEAD': k=d[i]; break; case '-BODY': k=d[i]; break;
        case '-FOOT': k=d[i]; break;
        case '-BHEAD': k=d[i]; break;case '-BFOOT': k=d[i]; break;
        default: f[k]+=d[i]+NL;
        }
      }
    }else{return false;}
    out=me.parm(f['-HEAD'], dt[ix]);
    let url, a, l, y=-1;
    for(let i in dt){
      url=dt[i].url||''; a=url.split('/'); l=a.length;
      switch(tp){
      case 'side': if(a[l-1].search(/#/)>0){l=l+1;} break;
      case 'top2': if(a[l-1].search(/index.html/)<0){l=4;}else{l=3;} break;
      }
      switch(l){
      case 3:
        if(y>-1){out+=me.parm(f['-BFOOT'], dt[y]); y=-1;}
        out+=me.parm(f['-BHEAD'], dt[i]); y=i;
        break;
      case 4:
        out+=me.parm(f['-BODY'], dt[i]);
        break;
      }
    }
    if(y>-1){out+=me.parm(f['-BFOOT'], dt[y]); y=-1;}
    out+=me.parm(f['-FOOT'], dt[ix]);

    return out;
  }
  /**
 * メニューデータをパターン選択
 * @param  {String} type パターン top/top2/2nd/sibling/side
 * @param  {String} grp  グループID
 * @return {Array}      メニューオブジェクト配列
 * @method
 */
  selection(type, grp) {
    let me=this;
    let out={}, j=0, url, level, section, group;
    let f, a, b;

    let i; for(i in me.MENU){
      f=false; url=me.MENU[i].url||''; level=me.MENU[i].level||-1; section=me.MENU[i].section||'';
      group=me.MENU[i].group||'';
      a=url.split('/'); b=url.split('#');
      switch(type){
      case 'top': if(level<2 && section=='' && url.search(/index.html/)>0){f=true;}
        break;
      case 'top2': if(level<2 && section==''){f=true;}
        break;
      case '2nd': if(a[1]==grp && level==1 && section==''){f=true;}
        break;
      case 'sibling': if(group==grp && section==''){f=true;}
        break;
      case 'side': if(a[1]==grp && level==1){f=true;}
        break;
      case 'section': if(b[0]==grp && section!=''){f=true;}
        break;
      default: f=true;
      }
      if(f){out[j]=me.MENU[i]; j++;}
    }
    return out;
  }
  /**
 * ツールボックスパーツ
 * @return {Void} none
 * @method
 */
  toolbox() {
    let me=this, dt, i;

    dt=me.selection('all');
    me.INFOJ.prevp=''; me.INFOJ.nextp=''; me.INFOJ.prevpa=''; me.INFOJ.nextpa='';
    let f=false; for(i in dt){
      dt[i].url=dt[i].url||'';
      if(f){me.INFOJ.nextp=dt[i].url; me.INFOJ.nextpa=dt[i].title; break;}
      if(me.INFOJ.url==dt[i].url){f=true;}
      if(!f){me.INFOJ.prevp=dt[i].url; me.INFOJ.prevpa=dt[i].title;}
    }
  }
  /**
 * カラーサンプルを生成
 * @return {String} HTMLテキスト
 * @method
 */
  color() {
    return CLR.colorSample();
  }
  /**
 * メニューデータのインコア
 * @param  {Object}  op    実行オプション
 * @param  {Boolean} force 日付に関係なく更新 true/false
 * @return {Void}          none
 * @method
 */
  menuBuild(op, force) {
    let me=this; op=op||{}; force=force||false;
    let dt, fn, out, his, a, b, d, f, g, i, j, k, l, m, n, r, p, u, v, w, x, t;
    let base=op.base+'/'; //let local=op.local+'/';

    if(force==false){if(me.CON.menuBuild){
      if(me.CON.menuBuild==me.today()){return;} if(me.CON.timesift){return;}
      me.infoLog('日付が変わりました。　New Date='+me.today());
    }}
    me.CON.menuBuild=me.today();
    r=me.getFs(base+'index.cfg'); d=JSON.parse(r);
    let folders; for(j in d){
      f=true; if(d[j].CmsVersion){a=d[j].CmsVersion.split('/'); f=me.validation(a[1]);}
      if(f){if(d[j].Folders){folders=d[j].Folders;}}
    }
    if(folders){folders.unshift('');}else{folders=[];}    // トップを加える

    out=[]; his=[]; let cnt=0;
    for(i in folders){
      if(folders[i]==''){k='';}else{k=folders[i]+'/';}
      dt=me.dir(base+k, 'file');
      for(j in dt){
        fn=base+k+dt[j];
        if(me.modifier(fn)=='page' && dt[j].substr(0, 5)!='error'){
          d=me.pageinfo(fn); if(!d.PARM){d.PARM='Valid 99/12/31:00/01/01';}
          b=d.PARM.split(NL);
          w={}; for(x in b){v=me.unstring(b[x]); w[v[0]]=v[1];}
          w.Title=w.Title||'no title';
          if(k==''){l=0;}else{l=1;}
          p=me.lastOf(dt[j], '.'); if(p>0){u='/'+k+dt[j].substr(0, p)+'.html';}else{u='/'+k+dt[j];}
          if(k==''){g='top';}else{g=folders[i];}
          if(w.Short){m=w.Short;}
          else{n=w.Title.search(/\(/); if(n<0){m=w.Title;}else{m=w.Title.substr(0, n);}}
          if(w.Valid){f=me.validation(w.Valid);}else{f=true;}
          if(f){
            t=me.stat(fn).mtime; t=t.substr(0, 2)+'-'+t.substr(2, 2)+'-'+t.substr(4, 2);
            out.push({
              'sort': w.Sort, 'level': l, 'section': '', 'url': u,
              'title': w.Title, 'short': m, 'group': g, 'date': t, 'priority': w.Priority||0.5
            });
            cnt++;
          }else{
            me.infoLog('suppressed page:' + w.Title);
          }

          b=d.HISTORY.split(NL);
          for(x in b){
            v=me.unstring(b[x]);
            f=me.repby(me.filepart(dt[j]), '.page', '.html');
            if(v[0]){
              his.push({'date': v[0], 'title': v[1], 'url': u});
            }
          }
        }
      }
    }
    me.MENU=me.sort(out);
    me.HISTORY=me.sort(his, 'date', 'des');
    me.infoLog('メニュー更新しました。cnt=' + cnt);

  }
  /**
 * サイトマップXMLの生成
 * @param  {Object} res httpレスポンスインターフェイス
 * @return {String}     生成XMLテキスト
 * @method
 */
  sitemap(res) {
    let me=this; let out, ix, prty; out='';

    out+='<?xml version="1.0" encoding="UTF-8"?>';
    out+='<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    for(ix in me.MENU){
      prty=me.MENU[ix].priority||0.5;
      out+='<url>';
      out+='<loc>http://www.kmrweb.net'+me.MENU[ix].url+'</loc>';
      out+='<lastmod>20'+me.MENU[ix].date+'</lastmod>';
      out+='<changefreq>always</changefreq>';
      out+='<priority>'+prty+'</priority>';
      out+='</url>';
    }
    out+='</urlset>';
    res.writeHead(200, {
      'Content-Type': 'text/xml', 'charset': 'utf-8'
    });
    res.end(out);
  }
  /**
 * メニューデータのソート
 * @param  {Array}  dt  メニューオブジェクト配列
 * @param  {String} key キー項目
 * @param  {String} asc asc/dsc 昇順/降順
 * @return {Array}      結果オブジェクト配列
 * @method
 */
  sort(dt, key, asc) {
    let i, j, house, f, t; key=key||'sort'; asc=asc||'asc';
    for(i=0; i<dt.length-1; i++){
      for(j=i+1; j<dt.length; j++){
        f=dt[i][key]||''; t=dt[j][key]||'';
        if(asc=='asc'){
          if(t<f){house=dt[j]; dt[j]=dt[i]; dt[i]=house;}
        }else{
          if(t>f){house=dt[j]; dt[j]=dt[i]; dt[i]=house;}
        }
      }
    }
    return dt;
  }
  /**
 * 有効期間の判定
 * @param  {String}  term 有効期間表示（yy/mm/dd:yy/mm/dd）
 * @return {Boolean}      true/false OK/NG
 * @method
 */
  validation(term) {
    let me=this; let a;

    if(!term){return true;}
    a=term.split(':');
    if(!a[0]){a[0]='00/01/01';} if(!a[1]){a[1]='99/12/31';}
    if(a[0]<'00/01/01'){return false;} if(a[0]>'99/12/31'){return false;}
    if(a[1]<'00/01/01'){return false;} if(a[1]>'99/12/31'){return false;}
    if(me.CON.timesift){
      if(a[0]>me.CON.today){return false;}
      if(a[1]<me.CON.today){return false;}
    }else{
      if(a[0]>me.today('Y/M/D')){return false;}
      if(a[1]<me.today('Y/M/D')){return false;}
    }
    return true;

  }
  /**
 * セッションデータのクリーンアップ
 * @param  {Object} op 実行オプション
 * @return {Void}      none
 * @method
 */
  cleanup(op) {
    let me=this; op=op||{}; if(op.keepDays==undefined){op.keepDays=3;}
    let l, c, i, f, s, d, ca=0, cd=0;
    l=me.dir(op.data);
    c=me.addDays(op.keepDays*-1);
    for(i in l){
      ca++;
      f=op.data+'/'+l[i]; s=me.stat(f); d=s.atime.substr(0, 6);
      if(d<c){Fs.unlinkSync(f); cd++;}
    }
    me.infoLog('全件数:'+ca);
    me.infoLog('削除件数:'+cd);
  }
};
