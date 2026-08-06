$(document).ready(function () {
    $("#add-countries-btn").on("click", function (e) {
        e.preventDefault();
        let form = document.getElementById("country");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/countries",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                if (response.success) {
                    toastr.success(response.message);
                    window.location.href = response.redirect_url;
                    form.reset();
                } else {
                    toastr.error("Failed to create country post.");
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 422) {
                    let errors = jqXHR.responseJSON.errors;
                    for (let field in errors) {
                        toastr.error(errors[field][0]);
                    }
                } else {
                    toastr.error("An error occurred. Please try again.");
                }
            },
        });
    });

    $(document).on('change', '.current-event-toggle', function () {
    const countryId = $(this).data('id');
    const isActive = $(this).is(':checked') ? 1 : 0;

    $.ajax({
        url: '/countries/update-status',
        method: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            country_id: countryId,
            is_active: isActive
        },
        success: function (response) {
            if (response.success) {
                toastr.success(response.message);
            } else {
                toastr.error(response.message || 'Something went wrong.');
            }
        },
        error: function () {
            toastr.error('Failed to update status.');
        }
    });
});

    $(document).on("click", "#edit-countries", function (e) {
        e.preventDefault();

        var countryId = $(this).data("id");
        window.location.href = "/masters/countries/" + countryId + "/edit";
    });

    $(document).on("click", "#update-country", function (e) {
        e.preventDefault();
        var countryUpdateId = $(this).data("update-id");
        let form = document.getElementById("country");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/countries/" + countryUpdateId,
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                formData.append("_method", "PUT");
            },
        })
            .done(function (response) {
                if (response.success) {
                    toastr.success(response.message);
                    window.location.href = response.redirectUrl;
                } else {
                    toastr.error(response.message);
                }
            })
            .fail(function (xhr, status, error) {
                console.error("Error:", error);
                toastr.error("Failed to update the country. Please try again.");
            });
    });

    $(document).on("click", "#delete-countries", function (e) {
        e.preventDefault();
        var countryDeleteId = $(this).data("delete-id");

        if (!confirm("Are you sure you want to delete this country?")) {
            return;
        }

        $.ajax({
            url: "/masters/countries/" + countryDeleteId,
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                if (response.success) {
                    toastr.success(response.message);
                    window.location.href = response.redirectUrl;
                } else {
                    toastr.error(response.message);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
                toastr.error("Failed to delete the country. Please try again.");
            },
        });
    });
});
