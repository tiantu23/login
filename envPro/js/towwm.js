// 底部二维码
function showFooterQrcode(){
            document.getElementById('qrcodeModal').style.display = 'flex';
        }
        function closeFooterQrcode(){
            document.getElementById('qrcodeModal').style.display = 'none';
        }
        document.getElementById('qrcodeModal').addEventListener('click',function(e){
            if(e.target === this) closeFooterQrcode();
        });