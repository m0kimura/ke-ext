const keCms=require('ke-cms');
const Fs=require('fs');
const Http=require('http');
const {JSDOM}=require('jsdom');
const NL=String.fromCharCode(0x0a);
module.exports=class keExt extends keCms {
  constructor() {
    super();
  }
  /**
   * サーバー起動
   * @param  {Function} fn RESTインターフェイス処理
   * @param  {Object}   op 起動オプション
   * @return {void}        none
   * @method
   * @override
   */
  server(fn, op) {
    let me=this; op=op||{};
    this.setting(op);
    op.port=process.env.PORT||op.port||me.CFG.port||'8090';
    let l=me.CFG.current.search(/nodejs/);
    me.checkDir(['data', 'local'], me.CFG.current.substr(0, l));
    //
    me.Server=Http.createServer((req, res)=> {
      let error=true;
      me.sessionIn(req, res, op);
      me.analyzeRequest(req, res);
      switch(me.SS.PATH[1]){
      case 'rest':
        me.PROC(()=>{
          error=fn(me.SS, me);
          if(!error){me.sessionOut(req, res);}
        });
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
    }).listen(op.port);
    me.infoLog('サーバーが開始しました。 port:' + op.port);
  }
  /**
   * CMSメイン処理
   * @param  {String} url  URLパス
   * @param  {String} base ベースパス
   * @param  {Object} res  レスポンス
   * @return {Void}        none
   * @method
   */
  putHtml(url, base, res) {
    let me=this; let code=200;
    let b=url.split('/'); if(b[b.length-1]==''){url=url+'index.html';}
    let a=url.split('.'); let n;
    //
    if(!a[1]){
      a[0]+='/index'; a[1]='html'; url+='/index.html'; n=me.SS.PATH.length; me.SS.PATH[n]='';
    }else if(a[1]!='html'){
      res.writeHead(404, {'Content-Type':  'text/html', 'charset': 'utf-8'});
      res.end('ERROR 404');
    }
    //
    let dt={}, txt; dt.PARM='';
    try{
      if(!me.getInfoj(base)){
        res.writeHead(404, {'Content-Type':  'text/html', 'charset': 'utf-8'});
        res.end('ERROR putHTML');
        me.errorLog('GET CONFIG FILE:'+me.error);
        return;
      }else{
        if(!me.isExist(base+url)){
          let i, c, u;
          a[a.length-1]='apli'; c=''; u=''; for(i in a){u=u+c+a[i]; c='.';}
          if(me.isExist(base+u)){
            dt=me.extinfo(base+u, base);
            if(!dt.APLI){dt=me.pageinfo(base+'/error404.page', base); code=404;}
            me.layer(dt.PARM.split(NL));
            me.INFOJ.url=url;
            me.INFOJ.Short=me.INFOJ.Short||me.INFOJ.Title;
            me.CSS=dt.CSS||'';
            me.INFOJ.Template=me.INFOJ.Template||'extmain1';
            if(me.isExist(base+'/template/'+me.INFOJ.Template+'.htm')){
              txt=Fs.readFileSync(base+'/template/'+me.INFOJ.Template+'.htm', {encoding: 'utf8'});
            }else{
              txt='Template Not Found:'+base+'/template/'+me.INFOJ.Template+'.htm';
              me.infoLog(txt);
            }
          }else{
            a[a.length-1]='page'; c=''; u=''; for(i in a){u=u+c+a[i]; c='.';}
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
   * Ext用ｃｆｇファイル読み込み
   * @param  {String} fname CFGファイル名
   * @param  {String} base  ベースパス
   * @return {Object}       コンフィグ情報
   * @method
   */
  extinfo(fname, base) {
    let me=this;

    if(!me.isExist(fname)){fname=base+'/error404.page';} let d=me.getText(fname, true);

    let f={}, k='APLI';
    f.PARM=''; f.APLI=''; f.CSS='';

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
   * 拡張展開
   * @param  {[type]} buf  [description]
   * @param  {[type]} base [description]
   * @param  {[type]} dt   [description]
   * @return {[type]}      [description]
   * @method
   * @override
   */
  expand(buf, base, dt) {
    let window, $;
    let me=this; let txt=me.parm(buf);
    window=new JSDOM(txt).window;
    $=require('jquery')(window);
    $=me.devCss($); $=me.devPage($, dt); $=me.devInclude($);
    $=me.devParts($); $=me.devFrame($); $=me.devBlock($);
    $=me.devExt($, dt);
    if(me.CFG.mode=='debug'){$=me.debugInfo($);}
    if(me.INFOJ.Use=='responsive'){$=me.appendScript($, 'responsive');}
    return '<html>'+$('html').html()+'</html>';
  }
  /**
   * Extモジュールを展開する
   * @param  {Object} $ jQueryオブジェクト
   * @return {Object}   結果jQueryオブジェクト
   * @method
   */
  devExt($, dt) {
    let me=this, f, txt;
    txt=me.parm(dt.APLI);
    $('[cms-ext]').each(function(){
      f=$(this).attr('cms-ext');
      txt=me.parm(dt[f]);
      $(this).html(me.escape(txt));
    });
    return $;
  }
};
