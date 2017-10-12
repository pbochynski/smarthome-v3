module.exports = 
(function loadEnvTenants() {
    const config ={users:{}, keys:{}};
    for (var i=1;line=process.env['TENANT_'+i];i++) {
        const items = line.split(':');
        const tenant = items[0];
        items[2].split(',').forEach(
            key => {config.keys[key]=tenant}
        );
        config.users[tenant]=items[1].split(',')
    }
    return config;
})();

