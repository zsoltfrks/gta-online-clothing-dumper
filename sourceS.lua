-- Receives /dumpcloth output and writes dump_<gender>/dump_<gender>_<slot>.json
-- inside the resource folder, ready to commit or paste into a clothing catalog.
--
-- This is a development/curation tool — don't ensure it on a production server.

RegisterNetEvent('clothing-dumper:save', function(gender, slotKey, entries)
    if (gender ~= 'male' and gender ~= 'female')
        or type(slotKey) ~= 'string' or type(entries) ~= 'table' then
        return
    end

    local slot = slotKey:gsub('[^%w_]', '') -- keep the path filename-safe
    local lines = {}
    for _, entry in ipairs(entries) do
        lines[#lines + 1] = '  ' .. json.encode(entry)
    end
    local body = '[\n' .. table.concat(lines, ',\n') .. '\n]\n'

    local file = ('dump_%s/dump_%s_%s.json'):format(gender, gender, slot)
    SaveResourceFile(GetCurrentResourceName(), file, body, -1)
    print(('[clothing-dumper] wrote %s (%d entries)'):format(file, #entries))
end)
