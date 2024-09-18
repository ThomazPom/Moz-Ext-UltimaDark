function resolveIDKVars_direct(data)
{
    let expectedValueForResolvableColor = "rgba(255, 254, 253, 0.55)";
    let readable_variable_check_value = `rgba(255,254,253,var(--chunk_is_readable_${data.details.requestId}_${data.details.dataCount}))`;
    let option = new Option(); // Option must be in the loop because once the color is set to an unkonwn variable it stays at empty string
    document.head.appendChild(option);
    option.style.floodColor = readable_variable_check_value;
    let floodColor = getComputedStyle(option).floodColor;
    option.remove();
    console.log(readable_variable_check_value);
    if (floodColor != expectedValueForResolvableColor) {
        return {};
    } 
    
    console.log("Received data", data); 
    // The variables we are looking for might be in data.chunk we have to ensure they are "readable" to make them available to props_and_var_only_color_idk.
    // This is the whole point of waiting for the chunk to be written before reading the variables out of it.
    let ikd_chunk_resolved = uDark.edit_str(data.chunk, false, false, false, true);
    let props_and_var_only_color_idk = uDark.edit_str(data.chunk_variables, false, false, false, "partial_idk");
    data.resolved = true;
    data.chunk = ikd_chunk_resolved;
    data.chunk_variables = props_and_var_only_color_idk
    return data
}
console.log("Resolve IDK Vars is ready",resolveIDKVars_direct,window);