import struct
import sys
import os

def patch_macho(filepath):
    with open(filepath, 'rb') as f:
        data = bytearray(f.read())

    magic = struct.unpack_from('<I', data, 0)[0]
    is_64 = magic == 0xfeedfacf
    is_32 = magic == 0xfeedface
    
    if not (is_64 or is_32):
        # Check fat binary
        if magic in (0xcafebabe, 0xbebafeca):
            print("Fat binary detected")
            nfat = struct.unpack_from('>I', data, 4)[0]
            for i in range(nfat):
                offset = struct.unpack_from('>I', data, 8 + i * 20 + 8)[0]
                size = struct.unpack_from('>I', data, 8 + i * 20 + 12)[0]
                patch_slice(data, offset, size)
            with open(filepath, 'wb') as f:
                f.write(data)
            return
        else:
            print(f"Unknown magic: {hex(magic)}")
            return

    patch_slice(data, 0, len(data))
    with open(filepath, 'wb') as f:
        f.write(data)

def patch_slice(data, base_offset, slice_size):
    magic = struct.unpack_from('<I', data, base_offset)[0]
    is_64 = magic == 0xfeedfacf
    header_size = 32 if is_64 else 28
    ncmds = struct.unpack_from('<I', data, base_offset + 16)[0]
    
    offset = base_offset + header_size
    LC_BUILD_VERSION = 0x32
    
    for _ in range(ncmds):
        cmd, cmdsize = struct.unpack_from('<II', data, offset)
        if cmd == LC_BUILD_VERSION:
            platform, minos, sdk, ntools = struct.unpack_from('<IIII', data, offset + 8)
            print(f"Found LC_BUILD_VERSION: platform={platform}, minos={hex(minos)}, sdk={hex(sdk)}, ntools={ntools}")
            # Target iOS 26.5 (0x001a0500)
            new_sdk = (26 << 16) | (5 << 8) | 0
            struct.pack_into('<I', data, offset + 16, new_sdk)
            print(f"Patched SDK version to: {hex(new_sdk)} (iOS 26.5)")
            return
        offset += cmdsize

if __name__ == '__main__':
    if len(sys.argv) > 1:
        patch_macho(sys.argv[1])
    else:
        print("Usage: patch_macho.py <path_to_executable>")
